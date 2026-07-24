const crypto = require('crypto');

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_PERIOD_SECONDS = 30;

function decodeBase32(value) {
  const normalized = String(value || '').trim().toUpperCase().replace(/=+$/u, '');
  if (!/^[A-Z2-7]{16,128}$/u.test(normalized)) {
    throw new Error('Invalid TOTP secret');
  }

  let bits = '';
  for (const character of normalized) {
    bits += BASE32_ALPHABET.indexOf(character).toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8) {
    bytes.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  }
  return Buffer.from(bytes);
}

function counterForTime(timestamp = Date.now()) {
  return Math.floor(timestamp / 1000 / TOTP_PERIOD_SECONDS);
}

function generateForCounter(secret, counter) {
  const key = decodeBase32(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = (
    ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff)
  );

  return String(binary % 1_000_000).padStart(6, '0');
}

function generateTotp(secret, timestamp = Date.now()) {
  return generateForCounter(secret, counterForTime(timestamp));
}

function verifyTotp(secret, code, timestamp = Date.now(), window = 1) {
  if (!/^\d{6}$/u.test(String(code || ''))) return { valid: false };

  const supplied = Buffer.from(String(code));
  const currentCounter = counterForTime(timestamp);

  for (let drift = -window; drift <= window; drift += 1) {
    const counter = currentCounter + drift;
    if (counter < 0) continue;
    const expected = Buffer.from(generateForCounter(secret, counter));
    if (crypto.timingSafeEqual(supplied, expected)) {
      return { valid: true, counter };
    }
  }

  return { valid: false };
}

module.exports = {
  TOTP_PERIOD_SECONDS,
  counterForTime,
  generateTotp,
  verifyTotp,
};
