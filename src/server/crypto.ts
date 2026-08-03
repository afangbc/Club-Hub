/**
 * Password hashing and token generation.
 *
 * Everything here goes through WebCrypto rather than a native module so the same
 * code runs under Node and under an edge runtime. PBKDF2-HMAC-SHA256 at the
 * OWASP-recommended iteration count is the strongest KDF WebCrypto exposes —
 * swap in Argon2id here if the deployment target ever grows native modules.
 */

const ALGORITHM = "pbkdf2-sha256";
const ITERATIONS = 210_000;
const KEY_BYTES = 32;
const SALT_BYTES = 16;
const TOKEN_BYTES = 32;

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

/** Compares without leaking how many leading bytes matched. */
function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** Returns a self-describing digest: `algorithm$iterations$salt$hash`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await pbkdf2(password, salt, ITERATIONS);
  return `${ALGORITHM}$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, iterations, salt, hash] = stored.split("$");
  if (algorithm !== ALGORITHM || !iterations || !salt || !hash) return false;
  const rounds = Number.parseInt(iterations, 10);
  if (!Number.isFinite(rounds) || rounds < 1000) return false;
  try {
    const candidate = await pbkdf2(password, fromBase64(salt), rounds);
    return equalBytes(candidate, fromBase64(hash));
  } catch {
    return false;
  }
}

/** The raw value handed to the browser in a cookie. Never stored as-is. */
export function createSessionToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
}

/**
 * Session tokens are stored hashed, so a leaked database snapshot can't be
 * replayed as a live login. SHA-256 is enough here — tokens are already 256 bits
 * of entropy, so there is nothing to brute-force.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token));
  return toBase64(new Uint8Array(digest));
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}
