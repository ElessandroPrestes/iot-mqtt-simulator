const SENSITIVE_KEY = /^(authorization|cookie|password|passwordHash|refreshToken|accessToken|token|jwtSecret|secret|apiKey|mongodbUri)$/i;

function sanitizeString(value) {
  return value
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(https?:\/\/|mongodb(?:\+srv)?:\/\/)([^:\s/@]+):([^@\s/]+)@/gi, '$1$2:[REDACTED]@')
    .replace(/\b(password|token|secret)=([^&\s]+)/gi, '$1=[REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[REDACTED]');
}

function redact(value, seen = new WeakSet()) {
  if (typeof value === 'string') return sanitizeString(value);
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[CIRCULAR]';

  seen.add(value);
  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[REDACTED]' : redact(item, seen),
    ])
  );
}

module.exports = { redact, sanitizeString };
