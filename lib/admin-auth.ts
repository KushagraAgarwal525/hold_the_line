import { createHash, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "htl_admin";

export type AdminAccess = "unconfigured" | "unauthorized" | "ready";

export function adminToken(): string | undefined {
  const value = process.env.ADMIN_TOKEN;
  if (!value || !value.trim()) return undefined;
  return value;
}

export function tokenDigest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function tokenMatches(expected: string, presented: string): boolean {
  const left = Buffer.from(tokenDigest(expected));
  const right = Buffer.from(tokenDigest(presented));
  return timingSafeEqual(left, right);
}

export function adminAccess(presentedCookie: string | undefined): AdminAccess {
  const expected = adminToken();
  if (!expected) return "unconfigured";
  if (!presentedCookie || presentedCookie.length !== tokenDigest(expected).length) {
    return "unauthorized";
  }
  const left = Buffer.from(tokenDigest(expected));
  const right = Buffer.from(presentedCookie);
  if (!timingSafeEqual(left, right)) return "unauthorized";
  return "ready";
}
