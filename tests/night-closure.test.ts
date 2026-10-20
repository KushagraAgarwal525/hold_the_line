import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readClosedForTheNight, writeClosedForTheNight } from "../lib/night-closure";

describe("night closure flag", () => {
  it("defaults to off and persists only an explicit true", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "htl-night-"));
    expect(readClosedForTheNight(root)).toBe(false);
    writeClosedForTheNight(false, root);
    expect(readClosedForTheNight(root)).toBe(false);
    writeClosedForTheNight(true, root);
    expect(readClosedForTheNight(root)).toBe(true);
    fs.writeFileSync(path.join(root, "data", "local", "closed-for-the-night.json"), "{");
    expect(readClosedForTheNight(root)).toBe(false);
  });
});
