import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminAccess } from "../../../lib/admin-auth";
import { writeClosedForTheNight } from "../../../lib/night-closure";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const jar = await cookies();
  if (adminAccess(jar.get(ADMIN_COOKIE)?.value) !== "ready") {
    return new Response("Admin is not configured.", { status: 403 });
  }
  const form = await request.formData();
  writeClosedForTheNight(form.get("closed") === "true");
  return NextResponse.redirect(new URL("/admin", request.url));
}
