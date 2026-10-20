import { doorCopy } from "./doors";
import { leaksInAssistantText, type Canary } from "./leak-detector";
import { redactSecrets } from "./redact";

export type TapeTechnique = {
  name: string;
  judgedBy: "llm";
};

export type TapeTurn = {
  role: string;
  text: string;
  /** This turn is part of the breach. The exact leak is detected separately. */
  breach?: boolean;
};

export type TapeCall = {
  id: string;
  source: string;
  door: string;
  version: string;
  at: string;
  harmed: boolean;
  turns: TapeTurn[];
  techniques?: TapeTechnique[];
  audioOptIn?: boolean;
  recordingPath?: string | null;
};

export type TapeTurnView = {
  role: string;
  text: string;
  breach: boolean;
  leaking: boolean;
};

export type TapeEntry = {
  id: string;
  door: string;
  version: string;
  title: string;
  at: string;
  turns: TapeTurnView[];
  techniques: TapeTechnique[];
  recordingPath: string | null;
};

/** Public tape. Empty until a human breach is stored. Do not add sample calls. */
export function publicTapeCalls(): TapeCall[] {
  return [];
}

function roleLabel(role: string): string {
  const value = role.trim().toLowerCase();
  if (value === "assistant") return "Assistant";
  if (value === "user" || value === "caller") return "Caller";
  return role.trim() || "Turn";
}

function isAssistant(role: string): boolean {
  return role.trim().toLowerCase() === "assistant";
}

export function tapeEntries(calls: TapeCall[], canary?: Canary): TapeEntry[] {
  return calls
    .filter((call) => call.source === "human" && call.harmed)
    .slice()
    .sort((left, right) => (left.at < right.at ? 1 : left.at > right.at ? -1 : 0))
    .map((call) => {
      const copy = doorCopy(call.door, call.version);
      const turns = call.turns.map((turn) => {
        const text = canary ? redactSecrets(turn.text, canary) : turn.text;
        const leaking = Boolean(
          canary && isAssistant(turn.role) && leaksInAssistantText(turn.text, canary).length > 0,
        );
        return {
          role: roleLabel(turn.role),
          text,
          leaking,
          breach: Boolean(turn.breach) || leaking,
        };
      });
      const recordingPath =
        call.audioOptIn && call.recordingPath && call.recordingPath.trim()
          ? call.recordingPath
          : null;
      return {
        id: call.id,
        door: call.door,
        version: call.version,
        title: copy?.title ?? `${call.door}, ${call.version}`,
        at: call.at,
        turns,
        techniques: call.techniques ?? [],
        recordingPath,
      };
    });
}
