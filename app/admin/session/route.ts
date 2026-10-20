import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminToken, tokenDigest, tokenMatches } from "../../../lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const expected = adminToken();
  if (!expected) {
    return new Response("Admin is not configured.", { status: 503 });
  }
  const form = await request.formData();
  const presented = String(form.get("token") ?? "");
  if (!presented || !tokenMatches(expected, presented)) {
    return NextResponse.redirect(new URL("/admin?denied=1", request.url));
  }
  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.set(ADMIN_COOKIE, tokenDigest(expected), {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
