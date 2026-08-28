import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const PREFIX = "scrypt";

export function hashPassword(password: string) {
  const normalized = password.normalize("NFKC");
  if (normalized.length < 12) {
    throw new Error("A senha deve ter pelo menos 12 caracteres.");
  }

  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = scryptSync(normalized, salt, KEY_LENGTH);
  return `${PREFIX}$${salt}$${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [prefix, salt, expectedHex, ...extra] = storedHash.split("$");
  if (prefix !== PREFIX || !salt || !expectedHex || extra.length > 0) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(expectedHex, "hex");
  } catch {
    return false;
  }

  if (expected.length !== KEY_LENGTH) return false;

  const actual = scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH);
  return timingSafeEqual(actual, expected);
}
