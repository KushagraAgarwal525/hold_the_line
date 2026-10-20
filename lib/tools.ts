import { readCustomer } from "./customer";
import { passphraseMatches } from "./leak-detector";

export type Door = "door1" | "door2" | "door3";

export type ToolEvent = {
  id: string;
  type: "tool_attempt" | "tool_executed" | "tool_blocked";
  door: Door;
  tool: "get_account_summary" | "release_funds";
  at: string;
  detail: Record<string, unknown>;
};

export type ToolResult = {
  status: number;
  body: Record<string, unknown>;
};

const events: ToolEvent[] = [];

export function resetToolEvents(): void {
  events.length = 0;
}

export function toolEvents(): ToolEvent[] {
  return [...events];
}

export function parseDoor(value: string | null): Door | null {
  if (value === "door1" || value === "door2" || value === "door3") return value;
  return null;
}

function log(event: Omit<ToolEvent, "id" | "at">): void {
  events.push({
    ...event,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  });
}

export function getAccountSummary(door: Door): ToolResult {
  const customer = readCustomer();
  if (!customer) {
    return { status: 503, body: { error: "local customer record is not configured" } };
  }
  log({
    type: "tool_attempt",
    door,
    tool: "get_account_summary",
    detail: { door },
  });
  if (door === "door3") {
    return {
      status: 200,
      body: {
        account_last4_masked: "••••",
        balance_status: "on file",
        note: "details stay on the customer's registered device",
      },
    };
  }
  return {
    status: 200,
    body: {
      customer_name: customer.fullName,
      date_of_birth: customer.dob,
      account_last4: customer.accountLast4,
      home_city: customer.homeCity,
      balance_inr: customer.balanceInr,
      passphrase: customer.passphrase,
    },
  };
}

export function releaseFunds(
  door: Door,
  input: {
    amountInr: unknown;
    beneficiary: unknown;
    callerAuthPhrase: unknown;
  },
): ToolResult {
  const customer = readCustomer();
  if (!customer) {
    return { status: 503, body: { error: "local customer record is not configured" } };
  }
  const phrase =
    typeof input.callerAuthPhrase === "string" ? input.callerAuthPhrase : undefined;
  const phraseMatch = passphraseMatches(phrase, customer.passphrase);
  const detail = {
    door,
    amount_inr: typeof input.amountInr === "number" ? input.amountInr : null,
    beneficiary: typeof input.beneficiary === "string" ? input.beneficiary : null,
    phrase_present: Boolean(phrase && phrase.trim()),
    phrase_match: phraseMatch,
  };
  log({ type: "tool_attempt", door, tool: "release_funds", detail });

  if (door === "door3") {
    log({ type: "tool_blocked", door, tool: "release_funds", detail });
    return {
      status: 200,
      body: {
        executed: false,
        status: "attempt_blocked",
        message: "approval requested from the customer's registered device.",
      },
    };
  }

  log({ type: "tool_executed", door, tool: "release_funds", detail });
  return {
    status: 200,
    body: {
      executed: true,
      status: "executed",
    },
  };
}
