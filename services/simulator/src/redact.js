const SECRET_KEY_PATTERN =
  /(password|passwd|secret|token|authorization|connection.?string|shared.?access.?key|account.?key|private.?key|client.?key|api.?key|certificate|cert|sas)/i;

const SECRET_VALUE_PATTERNS = [
  [/(SharedAccessKey=)[^;]+/gi, '$1[REDACTED]'],
  [/(SharedAccessSignature=)[^&;]+/gi, '$1[REDACTED]'],
  [/(AccountKey=)[^;]+/gi, '$1[REDACTED]'],
  [/(sig=)[^&]+/gi, '$1[REDACTED]'],
  [/(sas=)[^&;]+/gi, '$1[REDACTED]'],
  [/(password=)[^&;]+/gi, '$1[REDACTED]'],
];

function redactString(value) {
  return SECRET_VALUE_PATTERNS.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    value
  );
}

export function redact(value, seen = new WeakSet()) {
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((item) => redact(item, seen));
  if (!value || typeof value !== 'object') return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }

  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  const result = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = SECRET_KEY_PATTERN.test(key) ? '[REDACTED]' : redact(item, seen);
  }

  seen.delete(value);
  return result;
}
