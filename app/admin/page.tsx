import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminReady, AdminSignIn, AdminUnconfigured } from "../../components/admin-panel";
import { ADMIN_COOKIE, adminAccess } from "../../lib/admin-auth";
import { readClosedForTheNight } from "../../lib/night-closure";
import { planUnlink } from "../../lib/unlink";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "Kill switch for the night desk. Not configured until an admin token is set.",
};

function unlinkDetail(code: string | undefined): string | null {
  if (code === "ok") return "Unlink returned HTTP 200.";
  if (code === "failed") return "Unlink was called and did not return HTTP 200.";
  if (code === "not-called") return "Unlink was not called.";
  return null;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const params = await searchParams;
  const jar = await cookies();
  const access = adminAccess(jar.get(ADMIN_COOKIE)?.value);
  if (access === "unconfigured") return <AdminUnconfigured />;
  if (access === "unauthorized") return <AdminSignIn denied={params.denied === "1"} />;
  const plan = planUnlink(process.env.BOLNA_API_KEY, process.env.BOLNA_PHONE_NUMBER_ID);
  const detail = unlinkDetail(jar.get("htl_unlink_result")?.value);
  return (
    <AdminReady
      closed={readClosedForTheNight()}
      plan={plan}
      unlinkDetail={detail === "Unlink was not called." && !plan.call ? plan.reason : detail}
    />
  );
}
