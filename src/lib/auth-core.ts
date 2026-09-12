import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const SESSION_COOKIE = "stumanage_session";
export const SESSION_DAYS = 14;

export type SessionPayload = {
  tid: number;
  email: string;
  exp: number;
};

function getSecret() {
  const envSecret = process.env.AUTH_SECRET || "";
  if (envSecret.length >= 32) return envSecret;
  const dir = path.join(process.cwd(), "data");
  const secretPath = path.join(dir, "auth-secret");
  try {
    const existing = fs.readFileSync(secretPath, "utf8").trim();
    if (existing.length >= 32) return existing;
  } catch {}
  fs.mkdirSync(dir, { recursive: true });
  const generated = randomBytes(48).toString("base64url");
  fs.writeFileSync(secretPath, generated, { encoding: "utf8", mode: 0o600 });
  return generated;
}

function encode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function signBody(body: string) {
  return createHmac("sha256", getSecret()).update(body).digest("base64url");
}

export function createSessionToken(payload: SessionPayload) {
  const body = encode(JSON.stringify(payload));
  return `${body}.${signBody(body)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = signBody(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!Number.isInteger(payload.tid) || !payload.email || !payload.exp) return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${key}`;
}

export function verifyPassword(password: string, encoded: string) {
  const [kind, salt, hash] = encoded.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function requestUsesHttps(req: { headers: { get(name: string): string | null }; nextUrl?: { protocol?: string } }) {
  const forwarded = (req.headers.get("x-forwarded-proto") || "").split(",")[0].trim().toLowerCase();
  if (forwarded) return forwarded === "https";
  return req.nextUrl?.protocol === "https:";
}
