import { describe, expect, it } from "vitest";
import {
  type OutcomeRow,
  assertSingleDoorVersion,
  humanOnly,
  outcomeRate,
  ruleOfThreeUpper,
  wilsonInterval,
} from "../lib/stats";

function close(actual: number, expected: number): void {
  expect(actual).toBeCloseTo(expected, 9);
}

function row(
  partial: Partial<OutcomeRow> & Pick<OutcomeRow, "source" | "door" | "version">,
): OutcomeRow {
  return {
    persuaded: false,
    harmed: false,
    ...partial,
  };
}

describe("wilson interval", () => {
  it("matches the 95% Wilson interval for several fractions", () => {
    const zero = wilsonInterval(0, 100);
    close(zero.lower, 0);
    close(zero.upper, 0.0369934982);

    const one = wilsonInterval(1, 100);
    close(one.lower, 0.0017674321);
    close(one.upper, 0.0544861962);

    const half = wilsonInterval(50, 100);
    close(half.lower, 0.4038315304);
    close(half.upper, 0.5961684696);

    const three = wilsonInterval(3, 10);
    close(three.lower, 0.1077912674);
    close(three.upper, 0.6032218525);
  });

  it("keeps the point estimate inside the interval", () => {
    const interval = wilsonInterval(3, 10);
    expect(interval.lower).toBeLessThanOrEqual(0.3);
    expect(interval.upper).toBeGreaterThanOrEqual(0.3);
  });

  it("rejects empty, negative, and non-integer inputs", () => {
    expect(() => wilsonInterval(0, 0)).toThrow(/positive/);
    expect(() => wilsonInterval(-1, 10)).toThrow(/out of range/);
    expect(() => wilsonInterval(11, 10)).toThrow(/out of range/);
    expect(() => wilsonInterval(1.5, 10)).toThrow(/integer/);
  });
});

describe("rule of three", () => {
  it("is 3/N for zero events", () => {
    expect(ruleOfThreeUpper(100)).toBe(0.03);
    expect(ruleOfThreeUpper(30)).toBe(0.1);
    expect(ruleOfThreeUpper(1)).toBe(3);
  });

  it("rejects zero trials", () => {
    expect(() => ruleOfThreeUpper(0)).toThrow(/positive/);
  });
});

describe("human-only filter and versions", () => {
  it("drops synthetic and any source other than human", () => {
    const rows = [
      row({ source: "human", door: "door1", version: "d1-v1" }),
      row({ source: "synthetic", door: "door1", version: "d1-v1" }),
      row({ source: "test", door: "door1", version: "d1-v1" }),
    ];
    expect(humanOnly(rows).map((item) => item.source)).toEqual(["human"]);
  });

  it("refuses to mix doors or versions", () => {
    expect(() =>
      assertSingleDoorVersion([
        { door: "door1", version: "d1-v1" },
        { door: "door1", version: "d1-v2" },
      ]),
    ).toThrow(/mix doors or versions/);
    expect(() =>
      assertSingleDoorVersion([
        { door: "door1", version: "d1-v1" },
        { door: "door3", version: "d1-v1" },
      ]),
    ).toThrow(/mix doors or versions/);
  });

  it("computes a human rate for one door and version", () => {
    const rows = [
      row({ source: "human", door: "door3", version: "d3-v1", persuaded: true, harmed: false }),
      row({ source: "human", door: "door3", version: "d3-v1", persuaded: false, harmed: false }),
      row({ source: "synthetic", door: "door3", version: "d3-v2", persuaded: true, harmed: true }),
    ];
    const persuaded = outcomeRate(rows, "persuaded");
    expect(persuaded.n).toBe(2);
    expect(persuaded.k).toBe(1);
    expect(persuaded.rate).toBe(0.5);
    expect(persuaded.ruleOfThreeUpper).toBeNull();
    expect(persuaded.door).toBe("door3");
    expect(persuaded.version).toBe("d3-v1");

    const harmed = outcomeRate(rows, "harmed");
    expect(harmed.k).toBe(0);
    expect(harmed.n).toBe(2);
    expect(harmed.ruleOfThreeUpper).toBe(1.5);
    expect(harmed.wilson?.lower).toBe(0);
  });

  it("does not let a synthetic row of another version into the human rate", () => {
    const rows = [
      row({ source: "human", door: "door1", version: "d1-v1", harmed: false }),
      row({ source: "synthetic", door: "door1", version: "d1-v2", harmed: true }),
    ];
    expect(outcomeRate(rows, "harmed").n).toBe(1);
    expect(outcomeRate(rows, "harmed").k).toBe(0);
  });

  it("throws when the human rows themselves mix versions", () => {
    const rows = [
      row({ source: "human", door: "door1", version: "d1-v1" }),
      row({ source: "human", door: "door1", version: "d1-v2" }),
    ];
    expect(() => outcomeRate(rows, "persuaded")).toThrow(/mix doors or versions/);
  });

  it("returns an empty rate when nothing human remains", () => {
    const rate = outcomeRate(
      [row({ source: "synthetic", door: "door1", version: "d1-v1", persuaded: true })],
      "persuaded",
    );
    expect(rate).toEqual({
      n: 0,
      k: 0,
      rate: null,
      wilson: null,
      ruleOfThreeUpper: null,
      door: null,
      version: null,
    });
  });
});
