import { describe, expect, it } from "vitest";
import type { OutcomeRow } from "../lib/stats";
import {
  formatOutcome,
  humanCallCount,
  outcomeTone,
  publicCallRows,
  resultsByDoor,
} from "../lib/public-results";
import { outcomeRate } from "../lib/stats";

function row(partial: Partial<OutcomeRow> & Pick<OutcomeRow, "source" | "door" | "version">): OutcomeRow {
  return { persuaded: false, harmed: false, ...partial };
}

describe("public results", () => {
  it("starts from an empty human list", () => {
    expect(publicCallRows()).toEqual([]);
    expect(humanCallCount(publicCallRows())).toBe(0);
  });

  it("drops synthetic rows from the count and from every door rate", () => {
    const rows = [
      row({ source: "synthetic", door: "door1", version: "d1-v1", persuaded: true, harmed: true }),
      row({ source: "synthetic", door: "door3", version: "d3-v1", persuaded: true, harmed: false }),
    ];
    expect(humanCallCount(rows)).toBe(0);
    const results = resultsByDoor(rows);
    expect(results).toHaveLength(3);
    for (const result of results) {
      expect(result.persuaded.n).toBe(0);
      expect(result.persuaded.wilson).toBeNull();
      expect(result.harmed.n).toBe(0);
      expect(result.harmed.ruleOfThreeUpper).toBeNull();
      expect(formatOutcome(result.persuaded)).toBe("n = 0. No interval.");
    }
  });

  it("counts one door and version without borrowing another", () => {
    const rows = [
      row({ source: "human", door: "door1", version: "d1-v1", persuaded: true, harmed: true }),
      row({ source: "human", door: "door1", version: "d1-v1", persuaded: false, harmed: false }),
      row({ source: "human", door: "door1", version: "d1-v2", persuaded: true, harmed: true }),
      row({ source: "synthetic", door: "door2", version: "d2-v1", persuaded: true, harmed: true }),
    ];
    const results = resultsByDoor(rows);
    const v1 = results.find((item) => item.door === "door1" && item.version === "d1-v1");
    const v2 = results.find((item) => item.door === "door1" && item.version === "d1-v2");
    const door2 = results.find((item) => item.door === "door2");
    expect(v1?.persuaded).toEqual(outcomeRate(rows.filter((item) => item.version === "d1-v1"), "persuaded"));
    expect(v1?.persuaded.n).toBe(2);
    expect(v1?.persuaded.k).toBe(1);
    expect(v1?.harmed.k).toBe(1);
    expect(v2?.persuaded.n).toBe(1);
    expect(v2?.persuaded.k).toBe(1);
    expect(door2?.persuaded.n).toBe(0);
    expect(formatOutcome(v1!.persuaded)).toContain("n = 2");
    expect(formatOutcome(v1!.persuaded)).toContain("Wilson 95% interval");
  });

  it("uses the rule of three when a human door has zero harm", () => {
    const rows = [
      row({ source: "human", door: "door3", version: "d3-v1", persuaded: true, harmed: false }),
      row({ source: "human", door: "door3", version: "d3-v1", persuaded: false, harmed: false }),
    ];
    const door3 = resultsByDoor(rows).find((item) => item.door === "door3");
    expect(door3?.harmed.ruleOfThreeUpper).toBe(1.5);
    expect(formatOutcome(door3!.harmed)).toContain("0 of 2");
    expect(formatOutcome(door3!.harmed)).toContain("about 3/2");
    expect(formatOutcome(door3!.harmed)).toContain("n = 2");
  });

  it("paints breach red only when harm happened", () => {
    const none = outcomeRate(
      [row({ source: "human", door: "door3", version: "d3-v1", harmed: false })],
      "harmed",
    );
    const some = outcomeRate(
      [row({ source: "human", door: "door1", version: "d1-v1", harmed: true })],
      "harmed",
    );
    const empty = outcomeRate([], "harmed");
    expect(outcomeTone("harmed", none)).toBe("ink");
    expect(outcomeTone("harmed", some)).toBe("breached");
    expect(outcomeTone("harmed", empty)).toBe("ink");
    expect(outcomeTone("persuaded", some)).toBe("violet");
    expect(outcomeTone("persuaded", none)).toBe("ink");
  });
});
