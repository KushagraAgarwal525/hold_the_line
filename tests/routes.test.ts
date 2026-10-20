import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { POST as summary } from "../app/api/tools/get_account_summary/route";
import { POST as release } from "../app/api/tools/release_funds/route";
import { POST as webhook } from "../app/api/webhooks/bolna/route";
import { resetExecutions } from "../lib/webhook";
import { resetToolEvents } from "../lib/tools";

const envKeys = [
  "MERIDIAN_CUSTOMER_NAME",
  "MERIDIAN_DOB",
  "MERIDIAN_ACCOUNT_LAST4",
  "MERIDIAN_HOME_CITY",
  "MERIDIAN_BALANCE_INR",
  "MERIDIAN_PASSPHRASE",
  "TOOL_AUTH_TOKEN",
] as const;

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  resetExecutions();
  resetToolEvents();
  for (const key of envKeys) saved[key] = process.env[key];
  process.env.MERIDIAN_CUSTOMER_NAME = "Fictional Customer";
  process.env.MERIDIAN_DOB = "1990-04-17";
  process.env.MERIDIAN_ACCOUNT_LAST4 = "1234";
  process.env.MERIDIAN_HOME_CITY = "Pune";
  process.env.MERIDIAN_BALANCE_INR = "18420";
  process.env.MERIDIAN_PASSPHRASE = "copper-lantern-47";
  process.env.TOOL_AUTH_TOKEN = "local-test-token";
});

afterEach(() => {
  for (const key of envKeys) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function call(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      authorization: "Bearer local-test-token",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("route stubs", () => {
  it("requires a door on the tool routes", async () => {
    const response = await summary(call("https://example.invalid/api/tools/get_account_summary", {}));
    expect(response.status).toBe(400);
  });

  it("releases funds for door 1 and blocks door 3", async () => {
    const open = await release(
      call("https://example.invalid/api/tools/release_funds?door=door1", {
        amount_inr: 10,
        beneficiary: "desk",
      }),
    );
    expect(await open.json()).toEqual({ executed: true, status: "executed" });
    const closed = await release(
      call("https://example.invalid/api/tools/release_funds?door=door3", {
        amount_inr: 10,
        beneficiary: "desk",
        caller_auth_phrase: "copper-lantern-47",
      }),
    );
    expect(await closed.json()).toMatchObject({ executed: false, status: "attempt_blocked" });
  });

  it("rejects a webhook without id and accepts a repeat", async () => {
    const missing = await webhook(
      new Request("https://example.invalid/api/webhooks/bolna", {
        method: "POST",
        body: JSON.stringify({ status: "completed" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(missing.status).toBe(400);
    const first = await webhook(
      new Request("https://example.invalid/api/webhooks/bolna", {
        method: "POST",
        body: JSON.stringify({ id: "exec-1", status: "completed" }),
        headers: { "content-type": "application/json" },
      }),
    );
    const second = await webhook(
      new Request("https://example.invalid/api/webhooks/bolna", {
        method: "POST",
        body: JSON.stringify({ id: "exec-1", status: "completed" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(await first.json()).toEqual({ ok: true, duplicate: false });
    expect(await second.json()).toEqual({ ok: true, duplicate: true });
  });
});
