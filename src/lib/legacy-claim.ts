import { randomBytes, timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const CLAIM_FILE = "legacy-claim-code";

function dataDir() {
  return path.join(process.cwd(), "data");
}

function claimFilePath() {
  return path.join(dataDir(), CLAIM_FILE);
}

export function getLegacyClaimCode(): string {
  const fromEnv = (process.env.LEGACY_CLAIM_CODE || "").trim();
  if (fromEnv) return fromEnv;

  try {
    const existing = fs.readFileSync(claimFilePath(), "utf8").trim();
    if (existing) return existing;
  } catch {}

  fs.mkdirSync(dataDir(), { recursive: true });
  const generated = randomBytes(18).toString("base64url");
  fs.writeFileSync(claimFilePath(), generated, { encoding: "utf8", mode: 0o600 });
  return generated;
}

export function verifyLegacyClaimCode(input?: string | null): boolean {
  const value = (input || "").trim();
  if (!value) return false;
  const expected = getLegacyClaimCode();
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function clearGeneratedLegacyClaimCode() {
  if ((process.env.LEGACY_CLAIM_CODE || "").trim()) return;
  try { fs.unlinkSync(claimFilePath()); } catch {}
}
