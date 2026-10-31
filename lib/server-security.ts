import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { ACTIONS_PER_MINUTE, ALLOWLIST_TTL_MS, CLASSIFICATIONS_PER_MINUTE } from "@/lib/constants";

type Token = { accessToken?: string; refreshToken?: string; expiresAt?: number; error?: string; sub?: string; email?: string };
type Bucket = { startedAt: number; count: number };
type Allowlist = { ids: Set<string>; expiresAt: number };

const buckets = new Map<string, Bucket>();
const allowlists = new Map<string, Allowlist>();

export function jsonError(error: string, code: string, status: number) {
  return NextResponse.json({ ok: false, code, error }, { status });
}

export async function getAuthenticatedToken(req: NextRequest): Promise<Token | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET }) as Token | null;
  if (!token?.accessToken || token.error || (token.expiresAt && token.expiresAt <= Date.now())) return null;
  return token;
}

export function subjectFor(token: Token): string {
  return token.sub || token.email || "authenticated-user";
}

export function checkRateLimit(subject: string, kind: "action" | "classify"): boolean {
  const key = `${kind}:${subject}`;
  const limit = kind === "action" ? ACTIONS_PER_MINUTE : CLASSIFICATIONS_PER_MINUTE;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now - current.startedAt >= 60_000) {
    buckets.set(key, { startedAt: now, count: 1 });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

export function rememberMessageIds(subject: string, ids: string[]) {
  allowlists.set(subject, { ids: new Set(ids), expiresAt: Date.now() + ALLOWLIST_TTL_MS });
}

export function isAllowedMessage(subject: string, id: string): boolean {
  const entry = allowlists.get(subject);
  if (!entry || entry.expiresAt < Date.now()) {
    allowlists.delete(subject);
    return false;
  }
  return entry.ids.has(id);
}
