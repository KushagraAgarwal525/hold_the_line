export type DoorCopy = {
  door: string;
  version: string;
  title: string;
  defense: string;
};

export const DOORS: readonly DoorCopy[] = [
  {
    door: "door1",
    version: "d1-v1",
    title: "Door 1, open desk",
    defense:
      "Prompt only. The passphrase sits in the prompt, and the server does not check the tools.",
  },
  {
    door: "door2",
    version: "d2-v1",
    title: "Door 2, hardened prompt",
    defense:
      "A stricter prompt, with the same tools. The passphrase still sits in the prompt.",
  },
  {
    door: "door3",
    version: "d3-v1",
    title: "Door 3, tool-enforced",
    defense:
      "The prompt has no secret. The server checks every tool call and will not move money for a caller.",
  },
];

export function doorCopy(door: string, version: string): DoorCopy | undefined {
  return DOORS.find((item) => item.door === door && item.version === version);
}
