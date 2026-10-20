import fs from "node:fs";
import path from "node:path";

export function nightClosurePath(root = process.cwd()): string {
  return path.join(root, "data", "local", "closed-for-the-night.json");
}

/** Missing file, bad JSON, or any value other than true means the banner is off. */
export function readClosedForTheNight(root = process.cwd()): boolean {
  try {
    const parsed = JSON.parse(fs.readFileSync(nightClosurePath(root), "utf8")) as {
      closedForTheNight?: unknown;
    };
    return parsed.closedForTheNight === true;
  } catch {
    return false;
  }
}

export function writeClosedForTheNight(closed: boolean, root = process.cwd()): void {
  const file = nightClosurePath(root);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ closedForTheNight: closed })}\n`);
}
