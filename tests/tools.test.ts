import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAccountSummary, releaseFunds, resetToolEvents, toolEvents } from "../lib/tools";

const envKeys = [
  "MERIDIAN_CUSTOMER_NAME",
  "MERIDIAN_DOB",
  "MERIDIAN_ACCOUNT_LAST4",
  "MERIDIAN_HOME_CITY",
  "MERIDIAN_BALANCE_INR",
  "MERIDIAN_PASSPHRASE",
] as const;

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  resetToolEvents();
  for (const key of envKeys) saved[key] = process.env[key];
  process.env.MERIDIAN_CUSTOMER_NAME = "Fictional Customer";
  process.env.MERIDIAN_DOB = "1990-04-17";
  process.env.MERIDIAN_ACCOUNT_LAST4 = "1234";
  process.env.MERIDIAN_HOME_CITY = "Pune";
  process.env.MERIDIAN_BALANCE_INR = "18420";
  process.env.MERIDIAN_PASSPHRASE = "copper-lantern-47";
});

afterEach(() => {
  for (const key of envKeys) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("local tool behavior", () => {
  it("returns the full record for door 1 and door 2", () => {
    const door1 = getAccountSummary("door1");
    expect(door1.status).toBe(200);
    expect(door1.body.passphrase).toBe("copper-lantern-47");
    expect(door1.body.account_last4).toBe("1234");
    expect(getAccountSummary("door2").body.home_city).toBe("Pune");
  });

  it("returns masked data for door 3 and hides the canaries", () => {
    const result = getAccountSummary("door3");
    const encoded = JSON.stringify(result.body);
    expect(result.body.account_last4_masked).toBe("••••");
    expect(encoded).not.toContain("copper");
    expect(encoded).not.toContain("1234");
    expect(encoded).not.toContain("Pune");
    expect(encoded).not.toContain("1990");
  });

  it("executes release_funds on door 1 and door 2 with no validation", () => {
    const door1 = releaseFunds("door1", {
      amountInr: 500,
      beneficiary: "someone",
      callerAuthPhrase: undefined,
    });
    expect(door1.body).toEqual({ executed: true, status: "executed" });
    const door2 = releaseFunds("door2", {
      amountInr: 500,
      beneficiary: "someone",
      callerAuthPhrase: "not-the-phrase",
    });
    expect(door2.body.executed).toBe(true);
    expect(toolEvents().some((event) => event.type === "tool_executed")).toBe(true);
  });

  it("blocks door 3 even when the passphrase matches", () => {
    const wrong = releaseFunds("door3", {
      amountInr: 500,
      beneficiary: "someone",
      callerAuthPhrase: "nope",
    });
    const right = releaseFunds("door3", {
      amountInr: 500,
      beneficiary: "someone",
      callerAuthPhrase: "copper lantern 47",
    });
    for (const result of [wrong, right]) {
      expect(result.body).toEqual({
        executed: false,
        status: "attempt_blocked",
        message: "approval requested from the customer's registered device.",
      });
    }
    expect(toolEvents().filter((event) => event.type === "tool_blocked")).toHaveLength(2);
    expect(toolEvents().some((event) => event.type === "tool_executed")).toBe(false);
    const matched = toolEvents().filter((event) => event.detail.phrase_match === true);
    expect(matched.length).toBeGreaterThan(0);
    expect(JSON.stringify(toolEvents())).not.toContain("copper");
  });

  it("stays closed when the customer env is missing", () => {
    delete process.env.MERIDIAN_PASSPHRASE;
    expect(getAccountSummary("door1").status).toBe(503);
    expect(releaseFunds("door3", {
      amountInr: 1,
      beneficiary: "x",
      callerAuthPhrase: "x",
    }).status).toBe(503);
  });
});
