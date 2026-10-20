import { doorFromRequest, readJsonObject, toolAuthorized } from "../../../../lib/tool-http";
import { releaseFunds } from "../../../../lib/tools";

export async function POST(request: Request): Promise<Response> {
  const auth = toolAuthorized(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const door = doorFromRequest(request);
  if (!door) return Response.json({ error: "door query is required" }, { status: 400 });
  const body = await readJsonObject(request);
  if (!body) return Response.json({ error: "expected a JSON object" }, { status: 400 });
  const result = releaseFunds(door, {
    amountInr: body.amount_inr,
    beneficiary: body.beneficiary,
    callerAuthPhrase: body.caller_auth_phrase,
  });
  return Response.json(result.body, { status: result.status });
}
