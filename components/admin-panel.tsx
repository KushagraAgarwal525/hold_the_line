import type { UnlinkPlan } from "../lib/unlink";

export function AdminUnconfigured() {
  return (
    <main className="page" id="content">
      <h1>Admin</h1>
      <p className="copy">Admin is not configured.</p>
    </main>
  );
}

export function AdminSignIn({ denied }: { denied: boolean }) {
  return (
    <main className="page" id="content">
      <h1>Admin</h1>
      <p className="copy">Enter the admin token to continue.</p>
      {denied ? <p className="copy">That token does not match.</p> : null}
      <form className="claim-form" action="/admin/session" method="post">
        <label>
          Token
          <input name="token" type="password" autoComplete="current-password" />
        </label>
        <button type="submit">Continue</button>
      </form>
    </main>
  );
}

export function AdminReady({
  closed,
  plan,
  unlinkDetail,
}: {
  closed: boolean;
  plan: UnlinkPlan;
  unlinkDetail: string | null;
}) {
  return (
    <main className="page" id="content">
      <h1>Admin</h1>
      <section className="section">
        <h2>Closed for the night</h2>
        <p>{closed ? "The banner is on." : "The banner is off."}</p>
        <form className="claim-form" action="/admin/night" method="post">
          <input type="hidden" name="closed" value={closed ? "false" : "true"} />
          <button type="submit">{closed ? "Open the desk" : "Close for the night"}</button>
        </form>
      </section>
      <section className="section">
        <h2>Unlink a number</h2>
        <p className="copy">{plan.call ? "Ready to call POST /inbound/unlink." : plan.reason}</p>
        {unlinkDetail ? <p className="copy">{unlinkDetail}</p> : null}
        <form className="claim-form" action="/admin/unlink" method="post">
          <button type="submit" disabled={!plan.call}>
            Unlink
          </button>
        </form>
      </section>
    </main>
  );
}
