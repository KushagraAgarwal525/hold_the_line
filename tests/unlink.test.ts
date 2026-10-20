import { describe, expect, it } from "vitest";
import { executeUnlink, planUnlink, UNLINK_URL } from "../lib/unlink";

const phoneNumberId = "123e4567-e89b-12d3-a456-426614174000";

function fetchThatMustNotRun(): typeof fetch {
  return (async () => {
    throw new Error("unlink fetch should not run");
  }) as typeof fetch;
}

describe("unlink", () => {
  it("does not call unlink when BOLNA_API_KEY is missing", async () => {
    const plan = planUnlink(undefined, phoneNumberId);
    expect(plan.call).toBe(false);
    if (!plan.call) {
      expect(plan.reason).toContain("BOLNA_API_KEY is not set");
      expect(plan.reason).toContain("Unlink was not called");
    }
    const result = await executeUnlink("  ", phoneNumberId, fetchThatMustNotRun());
    expect(result.called).toBe(false);
  });

  it("does not call unlink when phone_number_id is missing or not a uuid", async () => {
    const missing = await executeUnlink("bn-test", undefined, fetchThatMustNotRun());
    expect(missing.called).toBe(false);
    if (!missing.called) expect(missing.reason).toContain("phone_number_id");
    const bad = await executeUnlink("bn-test", "not-a-uuid", fetchThatMustNotRun());
    expect(bad.called).toBe(false);
  });

  it("sends only phone_number_id when the key and id are both present", async () => {
    let seen: { url: string; body: string; authorization: string } | undefined;
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      seen = {
        url: String(url),
        body: String(init?.body),
        authorization: String(new Headers(init?.headers).get("authorization")),
      };
      return new Response("{}", { status: 200 });
    }) as typeof fetch;
    const result = await executeUnlink("bn-test", phoneNumberId, fetchImpl);
    expect(result).toEqual({ called: true, ok: true, detail: "Unlink returned HTTP 200." });
    expect(seen?.url).toBe(UNLINK_URL);
    expect(JSON.parse(seen?.body ?? "{}")).toEqual({ phone_number_id: phoneNumberId });
    expect(seen?.authorization).toBe("Bearer bn-test");
  });
});
