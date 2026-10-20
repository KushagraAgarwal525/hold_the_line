import { doorFromRequest, toolAuthorized } from "../../../../lib/tool-http";
import { getAccountSummary } from "../../../../lib/tools";

export async function POST(request: Request): Promise<Response> {
  const auth = toolAuthorized(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });
  const door = doorFromRequest(request);
  if (!door) return Response.json({ error: "door query is required" }, { status: 400 });
  const result = getAccountSummary(door);
  return Response.json(result.body, { status: result.status });
}
