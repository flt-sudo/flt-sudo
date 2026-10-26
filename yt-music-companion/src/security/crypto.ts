import crypto from "node:crypto";

export interface Sealed {
  ciphertext: string;
  iv: string;
  tag: string;
}

/** AES-256-GCM with a random 96-bit IV. `aad` binds the ciphertext to its purpose (e.g. provider name). */
export function seal(key: Buffer, plaintext: string, aad: string): Sealed {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return { ciphertext: ct.toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64") };
}

export function open(key: Buffer, sealed: Sealed, aad: string): string {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(sealed.iv, "base64"));
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(sealed.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(sealed.ciphertext, "base64")), decipher.final()]).toString("utf8");
}

/** Tokens are stored only as SHA-256 hashes; the raw value is shown to the user once. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function randomToken(prefix: string, bytes = 32): string {
  return `${prefix}_${crypto.randomBytes(bytes).toString("base64url")}`;
}

/** Constant-time comparison of two strings of possibly different length. */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export const uuid = (): string => crypto.randomUUID();
