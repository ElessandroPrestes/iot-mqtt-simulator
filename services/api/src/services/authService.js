const argon2 = require('argon2');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Session = require('../models/Session');

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

async function authenticateCredentials(username, password, config) {
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
  return publicPrincipal(principal);
}

function issueAccessToken(principal, config) {
  return jwt.sign(
    {
      username: principal.username,
      role: principal.role,
    },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      audience: config.jwtAudience,
      expiresIn: config.accessTokenTtlSeconds,
      issuer: config.jwtIssuer,
      jwtid: crypto.randomUUID(),
      subject: principal.id,
    }
  );
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString('base64url');
}

async function createSession(principal, config, familyId = crypto.randomUUID()) {
  const refreshToken = createOpaqueToken();
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlSeconds * 1000);

  await Session.create({
    tokenHash: hashToken(refreshToken),
    familyId,
    principalId: principal.id,
    role: principal.role,
    expiresAt,
  });

  return {
    accessToken: issueAccessToken(principal, config),
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
  if (!current || current.expiresAt <= new Date()) throw unauthorized();

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
  const usedAt = new Date();

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

  const expiresAt = new Date(Date.now() + config.refreshTokenTtlSeconds * 1000);
  await Session.create({
    tokenHash: nextHash,
    familyId: current.familyId,
    principalId: principal.id,
    role: principal.role,
    expiresAt,
  });

  return {
    accessToken: issueAccessToken(principal, config),
    refreshToken: nextToken,
    expiresAt,
    principal,
  };
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
  createSession,
  hashToken,
  issueAccessToken,
  revokeSession,
  rotateSession,
  unauthorized,
};
