import { parseDoor, type Door } from "./tools";

export function toolAuthorized(request: Request): { ok: true } | { ok: false; status: number; error: string } {
  const expected = process.env.TOOL_AUTH_TOKEN;
  if (!expected) {
    return { ok: false, status: 503, error: "tool auth is not configured" };
  }
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    return { ok: false, status: 401, error: "bearer token does not match" };
  }
  return { ok: true };
}

export function doorFromRequest(request: Request): Door | null {
  return parseDoor(new URL(request.url).searchParams.get("door"));
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  const text = await request.text();
  if (!text.trim()) return {};
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}
