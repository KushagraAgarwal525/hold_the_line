export const UNLINK_URL = "https://api.bolna.ai/inbound/unlink";

const PHONE_NUMBER_ID =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export type UnlinkPlan =
  | { call: false; reason: string }
  | {
      call: true;
      url: typeof UNLINK_URL;
      body: { phone_number_id: string };
      authorization: string;
    };

/**
 * POST /inbound/unlink takes only phone_number_id, from the inbound unlink docs.
 * Missing key or missing id means the request is not sent.
 */
export function planUnlink(
  apiKey: string | undefined,
  phoneNumberId: string | undefined,
): UnlinkPlan {
  const key = apiKey?.trim();
  if (!key) {
    return { call: false, reason: "BOLNA_API_KEY is not set. Unlink was not called." };
  }
  const id = phoneNumberId?.trim() ?? "";
  if (!PHONE_NUMBER_ID.test(id)) {
    return {
      call: false,
      reason:
        "POST /inbound/unlink needs a phone_number_id. None is configured, so unlink was not called.",
    };
  }
  return {
    call: true,
    url: UNLINK_URL,
    body: { phone_number_id: id },
    authorization: `Bearer ${key}`,
  };
}

export type UnlinkResult =
  | { called: false; reason: string }
  | { called: true; ok: boolean; detail: string };

export async function executeUnlink(
  apiKey: string | undefined,
  phoneNumberId: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<UnlinkResult> {
  const plan = planUnlink(apiKey, phoneNumberId);
  if (!plan.call) return { called: false, reason: plan.reason };
  const response = await fetchImpl(plan.url, {
    method: "POST",
    headers: {
      Authorization: plan.authorization,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(plan.body),
  });
  if (!response.ok) {
    return { called: true, ok: false, detail: `Unlink returned HTTP ${response.status}.` };
  }
  return { called: true, ok: true, detail: "Unlink returned HTTP 200." };
}
