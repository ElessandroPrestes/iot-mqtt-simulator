const argon2 = require('argon2');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const AuthenticationState = require('../models/AuthenticationState');
const { verifyTotp } = require('../utils/totp');

const dummyHashPromise = argon2.hash(crypto.randomBytes(32), {
  type: argon2.argon2id,
});

function unauthorized() {
  const error = new Error('Invalid credentials or session');
  error.status = 401;
  error.code = 'UNAUTHORIZED';
  return error;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function publicPrincipal(principal) {
  return {
    id: principal.id,
    username: principal.username,
    role: principal.role,
  };
}

function sessionLimitExceeded() {
  const error = new Error('Concurrent session limit reached');
  error.status = 409;
  error.code = 'SESSION_LIMIT';
  return error;
}

async function claimTotpCounter(principalId, counter) {
  const claimed = await AuthenticationState.findOneAndUpdate(
    {
      principalId,
      lastTotpCounter: { $lt: counter },
    },
    { $set: { lastTotpCounter: counter } },
    { new: true }
  );
  if (claimed) return true;

  try {
    await AuthenticationState.create({ principalId, lastTotpCounter: counter });
    return true;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
}

async function authenticateCredentials(username, password, totp, config) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  const principal = config.principals.find(
    (candidate) => candidate.enabled && candidate.username === normalizedUsername
  );

  const passwordHash = principal?.passwordHash || await dummyHashPromise;
  let valid = false;
  try {
    valid = await argon2.verify(passwordHash, String(password || ''));
  } catch {
    valid = false;
  }

  if (!principal || !valid) throw unauthorized();

  if (config.mfaRequired) {
    const verification = verifyTotp(principal.totpSecret, totp);
    if (!verification.valid
      || !await claimTotpCounter(principal.id, verification.counter)) {
      throw unauthorized();
    }
  }
  return publicPrincipal(principal);
}

function issueAccessToken(principal, familyId, config) {
  return jwt.sign(
    {
      username: principal.username,
      role: principal.role,
      sid: familyId,
    },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      audience: config.jwtAudience,
      expiresIn: config.accessTokenTtlSeconds,
      issuer: config.jwtIssuer,
      jwtid: crypto.randomUUID(),
      subject: principal.id,
      header: { typ: 'at+jwt' },
    }
  );
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString('base64url');
}

async function createSession(principal, config, familyId = crypto.randomUUID()) {
  const now = new Date();
  const activeFamilies = await Session.distinct('familyId', {
    principalId: principal.id,
    revokedAt: null,
    expiresAt: { $gt: now },
    lastActivityAt: {
      $gt: new Date(now.getTime() - config.sessionIdleTtlSeconds * 1000),
    },
  });
  if (!activeFamilies.includes(familyId)
    && activeFamilies.length >= config.maxConcurrentSessions) {
    throw sessionLimitExceeded();
  }

  const refreshToken = createOpaqueToken();
  const expiresAt = new Date(now.getTime() + config.refreshTokenTtlSeconds * 1000);

  await Session.create({
    tokenHash: hashToken(refreshToken),
    familyId,
    principalId: principal.id,
    role: principal.role,
    expiresAt,
    lastActivityAt: now,
  });

  return {
    accessToken: issueAccessToken(principal, familyId, config),
    refreshToken,
    expiresAt,
    principal,
  };
}

function principalFromConfig(principalId, role, config) {
  const principal = config.principals.find(
    (candidate) => candidate.enabled
      && candidate.id === principalId
      && candidate.role === role
  );
  if (!principal) throw unauthorized();
  return publicPrincipal(principal);
}

async function rotateSession(refreshToken, config) {
  if (!refreshToken) throw unauthorized();

  const currentHash = hashToken(refreshToken);
  const current = await Session.findOne({ tokenHash: currentHash });
  const now = new Date();
  const idleDeadline = new Date(now.getTime() - config.sessionIdleTtlSeconds * 1000);
  if (!current
    || current.expiresAt <= now
    || current.lastActivityAt <= idleDeadline) {
    throw unauthorized();
  }

  if (current.usedAt || current.revokedAt) {
    await Session.updateMany(
      { familyId: current.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
    throw unauthorized();
  }

  const principal = principalFromConfig(current.principalId, current.role, config);
  const nextToken = createOpaqueToken();
  const nextHash = hashToken(nextToken);
  const usedAt = now;

  const claimed = await Session.findOneAndUpdate(
    { _id: current._id, usedAt: null, revokedAt: null },
    { $set: { usedAt, replacedByHash: nextHash } },
    { new: true }
  );

  if (!claimed) {
    await Session.updateMany(
      { familyId: current.familyId, revokedAt: null },
      { $set: { revokedAt: usedAt } }
    );
    throw unauthorized();
  }

  const expiresAt = current.expiresAt;
  await Session.create({
    tokenHash: nextHash,
    familyId: current.familyId,
    principalId: principal.id,
    role: principal.role,
    expiresAt,
    lastActivityAt: now,
  });
  await Session.updateMany(
    { familyId: current.familyId, revokedAt: null },
    { $set: { lastActivityAt: now } }
  );

  return {
    accessToken: issueAccessToken(principal, current.familyId, config),
    refreshToken: nextToken,
    expiresAt,
    principal,
  };
}

async function validateAccessSession(principalId, familyId, config, now = new Date()) {
  if (!familyId) throw unauthorized();
  const idleDeadline = new Date(now.getTime() - config.sessionIdleTtlSeconds * 1000);
  const active = await Session.exists({
    familyId,
    principalId,
    revokedAt: null,
    expiresAt: { $gt: now },
    lastActivityAt: { $gt: idleDeadline },
  });
  if (!active) throw unauthorized();

  await Session.updateMany(
    { familyId, principalId, revokedAt: null },
    { $set: { lastActivityAt: now } }
  );
}

async function listSessions(principalId) {
  const now = new Date();
  return Session.aggregate([
    {
      $match: {
        principalId,
        revokedAt: null,
        expiresAt: { $gt: now },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$familyId',
        createdAt: { $min: '$createdAt' },
        lastActivityAt: { $max: '$lastActivityAt' },
        expiresAt: { $max: '$expiresAt' },
      },
    },
    {
      $project: {
        _id: 0,
        familyId: '$_id',
        createdAt: 1,
        lastActivityAt: 1,
        expiresAt: 1,
      },
    },
    { $sort: { lastActivityAt: -1 } },
  ]);
}

async function revokeFamily(familyId, principalId) {
  const result = await Session.updateMany(
    { familyId, principalId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  if (!result.matchedCount) throw unauthorized();
}

async function revokeSession(refreshToken) {
  if (!refreshToken) return;

  const session = await Session.findOne({ tokenHash: hashToken(refreshToken) });
  if (!session) return;

  await Session.updateMany(
    { familyId: session.familyId, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
}

module.exports = {
  authenticateCredentials,
  claimTotpCounter,
  createSession,
  hashToken,
  issueAccessToken,
  listSessions,
  revokeFamily,
  revokeSession,
  rotateSession,
  sessionLimitExceeded,
  unauthorized,
  validateAccessSession,
};
