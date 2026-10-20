import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminAccess } from "../../../lib/admin-auth";
import { executeUnlink } from "../../../lib/unlink";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const jar = await cookies();
  const access = adminAccess(jar.get(ADMIN_COOKIE)?.value);
  if (access !== "ready") {
    const message = access === "unconfigured" ? "Admin is not configured." : "Admin is not authorized.";
    return new Response(message, { status: 403 });
  }
  const result = await executeUnlink(process.env.BOLNA_API_KEY, process.env.BOLNA_PHONE_NUMBER_ID);
  const code = !result.called ? "not-called" : result.ok ? "ok" : "failed";
  const response = NextResponse.redirect(new URL("/admin", request.url));
  response.cookies.set("htl_unlink_result", code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/admin",
    maxAge: 120,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
