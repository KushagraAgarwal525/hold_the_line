/**
 * Webhook stub. The execution object documented on GET /executions/{id}
 * uses `id` and `status`. This store is idempotent on that id: a repeat of
 * the same id and status with the same JSON body is a no-op. A later status
 * for the same id updates the one record.
 *
 * Webhook signatures were not in the docs fetched on 20 Oct 2026. This route
 * does not pretend to verify one.
 */

const PHONE_KEYS = new Set([
  "user_number",
  "agent_number",
  "to_number",
  "from_number",
]);

export type StoredPayload = {
  status: string | null;
  body: unknown;
  receivedAt: string;
};

export type StoredExecution = {
  id: string;
  status: string | null;
  payloads: StoredPayload[];
};

const executions = new Map<string, StoredExecution>();

export function resetExecutions(): void {
  executions.clear();
}

export function getExecution(id: string): StoredExecution | undefined {
  return executions.get(id);
}

function redactKnownPhoneFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactKnownPhoneFields);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    if (PHONE_KEYS.has(key) && typeof inner === "string") out[key] = "[redacted]";
    else out[key] = redactKnownPhoneFields(inner);
  }
  return out;
}

function stable(value: unknown): string {
  return JSON.stringify(value);
}

export type WebhookResult =
  | { ok: true; duplicate: boolean; id: string }
  | { ok: false; status: number; error: string };

export function recordBolnaWebhook(body: unknown, now = new Date()): WebhookResult {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, error: "expected a JSON object" };
  }
  const record = body as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id.length === 0) {
    return { ok: false, status: 400, error: "missing execution id" };
  }
  const status = typeof record.status === "string" ? record.status : null;
  const storedBody = redactKnownPhoneFields(record);
  const existing = executions.get(record.id);
  const duplicate = existing?.payloads.some(
    (payload) => payload.status === status && stable(payload.body) === stable(storedBody),
  );
  if (duplicate) return { ok: true, duplicate: true, id: record.id };

  const next: StoredExecution = existing ?? {
    id: record.id,
    status,
    payloads: [],
  };
  next.status = status;
  next.payloads.push({ status, body: storedBody, receivedAt: now.toISOString() });
  executions.set(record.id, next);
  return { ok: true, duplicate: false, id: record.id };
}
