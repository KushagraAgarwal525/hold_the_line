import type { Metadata } from "next";
import { TapeList } from "../../components/tape-list";
import { publicTapeCalls, tapeEntries } from "../../lib/tape";

export const metadata: Metadata = {
  title: "Tape",
  description: "Replays of harmed human calls. None are stored yet.",
};

export default function TapePage() {
  const entries = tapeEntries(publicTapeCalls());
  return (
    <main className="page" id="content">
      <h1>Tape</h1>
      <TapeList entries={entries} />
    </main>
  );
}
