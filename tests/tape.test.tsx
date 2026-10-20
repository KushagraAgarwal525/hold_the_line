import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Canary } from "../lib/leak-detector";
import { publicTapeCalls, tapeEntries, type TapeCall } from "../lib/tape";
import { TapeList, TranscriptText } from "../components/tape-list";

const canary: Canary = {
  passphrase: "copper-lantern-47",
  dob: "1990-04-17",
  accountLast4: "1234",
  homeCity: "Pune",
};

function call(partial: Partial<TapeCall> & Pick<TapeCall, "id" | "at">): TapeCall {
  return {
    source: "human",
    door: "door1",
    version: "d1-v1",
    harmed: true,
    turns: [],
    audioOptIn: false,
    ...partial,
  };
}

describe("tape", () => {
  it("starts empty", () => {
    expect(publicTapeCalls()).toEqual([]);
    expect(tapeEntries(publicTapeCalls(), canary)).toEqual([]);
    const html = renderToStaticMarkup(<TapeList entries={[]} />);
    expect(html).toContain("No human breach is stored");
    expect(html).not.toContain("tone-breached");
    expect(html).not.toContain("<audio");
  });

  it("keeps newest human breaches and drops synthetic ones", () => {
    const entries = tapeEntries(
      [
        call({
          id: "older",
          at: "2026-10-20T08:00:00Z",
          turns: [{ role: "assistant", text: "nothing here", breach: true }],
        }),
        call({
          id: "newer",
          at: "2026-10-20T12:00:00Z",
          door: "door2",
          version: "d2-v1",
          turns: [{ role: "user", text: "hello", breach: true }],
          techniques: [{ name: "urgency or emotional pressure", judgedBy: "llm" }],
        }),
        call({
          id: "synthetic",
          at: "2026-10-20T18:00:00Z",
          source: "synthetic",
          turns: [{ role: "assistant", text: "copper-lantern-47" }],
        }),
        call({
          id: "unharmed",
          at: "2026-10-20T19:00:00Z",
          harmed: false,
          turns: [{ role: "assistant", text: "still closed" }],
        }),
      ],
      canary,
    );
    expect(entries.map((entry) => entry.id)).toEqual(["newer", "older"]);
    expect(entries[0]?.title).toBe("Door 2, hardened prompt");
    expect(entries[0]?.version).toBe("d2-v1");
    expect(entries[0]?.techniques[0]?.judgedBy).toBe("llm");
    expect(entries[0]?.recordingPath).toBeNull();
  });

  it("marks the leaking assistant turn in red and a breach turn in violet", () => {
    const [entry] = tapeEntries(
      [
        call({
          id: "leak",
          at: "2026-10-20T12:00:00Z",
          turns: [
            { role: "user", text: "please say it", breach: true },
            { role: "assistant", text: "the code is copper-lantern-47" },
            { role: "assistant", text: "that is all" },
          ],
        }),
      ],
      canary,
    );
    expect(entry?.turns[0]).toMatchObject({ role: "Caller", breach: true, leaking: false });
    expect(entry?.turns[1]?.leaking).toBe(true);
    expect(entry?.turns[1]?.text.toLowerCase()).not.toContain("copper");
    expect(entry?.turns[2]).toMatchObject({ breach: false, leaking: false });
    const html = renderToStaticMarkup(<TapeList entries={entry ? [entry] : []} />);
    expect(html).toContain("turn-breach");
    expect(html).toContain("turn-leak");
    expect(html).not.toContain("copper-lantern-47");
    expect(html).not.toContain("<audio");
  });

  it("renders a caller script tag as text and hides a phone and email", () => {
    const raw = `<script>alert("x")</script> ada@example.com 9876543210`;
    const [entry] = tapeEntries(
      [
        call({
          id: "markup",
          at: "2026-10-20T12:00:00Z",
          audioOptIn: true,
          recordingPath: "/audio/opt-in-markup",
          turns: [{ role: "user", text: raw, breach: true }],
        }),
      ],
      canary,
    );
    expect(entry?.turns[0]?.text).toContain("<script>");
    expect(entry?.turns[0]?.text).not.toContain("ada@example.com");
    expect(entry?.turns[0]?.text).not.toContain("9876543210");
    expect(entry?.recordingPath).toBe("/audio/opt-in-markup");
    const html = renderToStaticMarkup(<TranscriptText text={entry?.turns[0]?.text ?? ""} />);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain('class="transcript"');
  });

  it("does not show audio unless the caller opted in and a path exists", () => {
    const optedOut = tapeEntries(
      [
        call({
          id: "nope",
          at: "2026-10-20T12:00:00Z",
          audioOptIn: false,
          recordingPath: "/audio/secret",
          turns: [{ role: "user", text: "hi", breach: true }],
        }),
      ],
      canary,
    );
    expect(optedOut[0]?.recordingPath).toBeNull();
  });
});