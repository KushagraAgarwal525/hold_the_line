import { beforeEach, describe, expect, it } from "vitest";
import { getExecution, recordBolnaWebhook, resetExecutions } from "../lib/webhook";

beforeEach(() => {
  resetExecutions();
});

describe("bolna webhook stub", () => {
  it("rejects a body without the documented id field", () => {
    expect(recordBolnaWebhook({ execution_id: "abc", status: "completed" })).toEqual({
      ok: false,
      status: 400,
      error: "missing execution id",
    });
    expect(recordBolnaWebhook(["nope"])).toMatchObject({ ok: false, status: 400 });
  });

  it("is idempotent on execution id and status", () => {
    const body = {
      id: "b7140255-af33-4608-8e97-04dd944b8e48",
      status: "completed",
      transcript: "assistant: hello",
      user_number: "+919876543210",
      telephony_data: { from_number: "+919876543210", recording_url: "https://example.invalid/r" },
    };
    expect(recordBolnaWebhook(body)).toMatchObject({ ok: true, duplicate: false });
    expect(recordBolnaWebhook(body)).toMatchObject({ ok: true, duplicate: true });
    const stored = getExecution(body.id);
    expect(stored?.payloads).toHaveLength(1);
    expect(JSON.stringify(stored)).not.toContain("+919876543210");
    expect(JSON.stringify(stored)).toContain("[redacted]");
    expect(JSON.stringify(stored)).toContain("assistant: hello");
  });

  it("keeps one record when a later status arrives", () => {
    const id = "b7140255-af33-4608-8e97-04dd944b8e48";
    recordBolnaWebhook({ id, status: "in-progress" });
    recordBolnaWebhook({ id, status: "call-disconnected" });
    recordBolnaWebhook({ id, status: "completed", transcript: "assistant: done" });
    const stored = getExecution(id);
    expect(stored?.payloads.map((payload) => payload.status)).toEqual([
      "in-progress",
      "call-disconnected",
      "completed",
    ]);
    expect(stored?.status).toBe("completed");
  });
});
