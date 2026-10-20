/**
 * Public rates use Wilson 95% intervals.
 * Zero events in N trials also report the rule-of-three upper bound, 3/N.
 * Rows with source other than "human" are dropped. Doors and versions are never mixed.
 */

export const WILSON_Z = 1.959963984540054;

export type WilsonInterval = {
  lower: number;
  upper: number;
};

export type OutcomeRow = {
  source: string;
  door: string;
  version: string;
  persuaded: boolean;
  harmed: boolean;
};

export type OutcomeRate = {
  n: number;
  k: number;
  rate: number | null;
  wilson: WilsonInterval | null;
  ruleOfThreeUpper: number | null;
  door: string | null;
  version: string | null;
};

function assertInteger(name: string, value: number): void {
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`);
}

export function wilsonInterval(successes: number, trials: number): WilsonInterval {
  assertInteger("successes", successes);
  assertInteger("trials", trials);
  if (trials <= 0) throw new Error("trials must be positive");
  if (successes < 0 || successes > trials) throw new Error("successes out of range");

  const z2 = WILSON_Z * WILSON_Z;
  const p = successes / trials;
  const denom = 1 + z2 / trials;
  const center = (p + z2 / (2 * trials)) / denom;
  const margin =
    (WILSON_Z * Math.sqrt((p * (1 - p)) / trials + z2 / (4 * trials * trials))) / denom;
  const lower = Math.min(1, Math.max(0, center - margin));
  const upper = Math.min(1, Math.max(0, center + margin));
  return { lower, upper };
}

export function ruleOfThreeUpper(trials: number): number {
  assertInteger("trials", trials);
  if (trials <= 0) throw new Error("trials must be a positive integer");
  return 3 / trials;
}

export function humanOnly<T extends { source: string }>(rows: T[]): T[] {
  return rows.filter((row) => row.source === "human");
}

export function assertSingleDoorVersion(
  rows: { door: string; version: string }[],
): { door: string; version: string } | null {
  if (rows.length === 0) return null;
  const door = rows[0]?.door;
  const version = rows[0]?.version;
  if (door === undefined || version === undefined) {
    throw new Error("row is missing door or version");
  }
  const mixed = rows.some((row) => row.door !== door || row.version !== version);
  if (mixed) {
    const keys = [...new Set(rows.map((row) => `${row.door}/${row.version}`))].join(", ");
    throw new Error(`refusing to mix doors or versions: ${keys}`);
  }
  return { door, version };
}

export function outcomeRate(
  rows: OutcomeRow[],
  outcome: "persuaded" | "harmed",
): OutcomeRate {
  const humans = humanOnly(rows);
  const scope = assertSingleDoorVersion(humans);
  const n = humans.length;
  const k = humans.filter((row) => row[outcome]).length;
  if (!scope || n === 0) {
    return {
      n: 0,
      k: 0,
      rate: null,
      wilson: null,
      ruleOfThreeUpper: null,
      door: scope?.door ?? null,
      version: scope?.version ?? null,
    };
  }
  return {
    n,
    k,
    rate: k / n,
    wilson: wilsonInterval(k, n),
    ruleOfThreeUpper: k === 0 ? ruleOfThreeUpper(n) : null,
    door: scope.door,
    version: scope.version,
  };
}
