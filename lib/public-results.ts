import { DOORS, doorCopy } from "./doors";
import {
  humanOnly,
  outcomeRate,
  type OutcomeRate,
  type OutcomeRow,
} from "./stats";

/**
 * Public call rows. Empty until a database of human calls exists.
 * Do not put sample or synthetic rows here.
 */
export function publicCallRows(): OutcomeRow[] {
  return [];
}

export function humanCallCount(rows: OutcomeRow[]): number {
  return humanOnly(rows).length;
}

export type DoorResult = {
  door: string;
  version: string;
  title: string;
  defense: string | null;
  persuaded: OutcomeRate;
  harmed: OutcomeRate;
};

export function resultsByDoor(rows: OutcomeRow[]): DoorResult[] {
  const humans = humanOnly(rows);
  const keys: { door: string; version: string }[] = DOORS.map((door) => ({
    door: door.door,
    version: door.version,
  }));
  for (const row of humans) {
    const known = keys.some((key) => key.door === row.door && key.version === row.version);
    if (!known) keys.push({ door: row.door, version: row.version });
  }
  return keys.map((key) => {
    const scoped = rows.filter((row) => row.door === key.door && row.version === key.version);
    const copy = doorCopy(key.door, key.version);
    return {
      door: key.door,
      version: key.version,
      title: copy?.title ?? `${key.door}, ${key.version}`,
      defense: copy?.defense ?? null,
      persuaded: outcomeRate(scoped, "persuaded"),
      harmed: outcomeRate(scoped, "harmed"),
    };
  });
}

export type OutcomeTone = "ink" | "violet" | "breached";

export function outcomeTone(outcome: "persuaded" | "harmed", rate: OutcomeRate): OutcomeTone {
  if (outcome === "harmed" && rate.k > 0) return "breached";
  if (outcome === "persuaded" && rate.n > 0 && rate.k > 0) return "violet";
  return "ink";
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatOutcome(rate: OutcomeRate): string {
  if (rate.n === 0 || rate.rate === null || rate.wilson === null) {
    return "n = 0. No interval.";
  }
  const interval = `Wilson 95% interval ${percent(rate.wilson.lower)} to ${percent(rate.wilson.upper)}`;
  if (rate.k === 0 && rate.ruleOfThreeUpper !== null) {
    const numerator = Math.round(rate.ruleOfThreeUpper * rate.n);
    return `0 of ${rate.n}. n = ${rate.n}. ${interval}. Upper 95% bound about ${numerator}/${rate.n}.`;
  }
  return `${rate.k} of ${rate.n}. n = ${rate.n}. ${interval}.`;
}
