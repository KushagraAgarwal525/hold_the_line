import { recordBolnaWebhook } from "../../../../lib/webhook";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "expected a JSON object" }, { status: 400 });
  }
  const result = recordBolnaWebhook(body);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true, duplicate: result.duplicate });
}
