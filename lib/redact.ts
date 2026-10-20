import {
  type Canary,
  type LeakKind,
  leaksInAssistantText,
} from "./leak-detector";

const BLOCK = "█";

export function escapeText(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type Word = { raw: string; start: number; end: number };

function wordsOf(text: string): Word[] {
  const words: Word[] = [];
  const pattern = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    words.push({
      raw: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }
  return words;
}

function sameHits(left: LeakKind[], right: LeakKind[]): boolean {
  if (left.length !== right.length) return false;
  const set = new Set(left);
  return right.every((kind) => set.has(kind));
}

function sliceText(words: Word[], start: number, end: number): string {
  return words
    .slice(start, end)
    .map((word) => word.raw)
    .join(" ");
}

function maskContacts(text: string): string {
  let redacted = text.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    (match) => BLOCK.repeat(match.length),
  );
  redacted = redacted.replace(/\+\d{8,15}\b/g, (match) => BLOCK.repeat(match.length));
  redacted = redacted.replace(
    /(?<!\d)(?:\d[\s-]){9,14}\d(?!\d)/g,
    (match) => BLOCK.repeat(match.length),
  );
  redacted = redacted.replace(/(?<!\d)\d{10,15}(?!\d)/g, (match) => BLOCK.repeat(match.length));
  return redacted;
}

/** Canaries, emails, and phone numbers removed. HTML is not escaped yet. */
export function redactSecrets(text: string, canary: Canary): string {
  const words = wordsOf(text);
  const kill = new Array<boolean>(words.length).fill(false);
  const maxWindow = 32;
  let index = 0;
  while (index < words.length) {
    let found = -1;
    const upper = Math.min(words.length, index + maxWindow);
    for (let end = index + 1; end <= upper; end += 1) {
      if (leaksInAssistantText(sliceText(words, index, end), canary).length > 0) {
        found = end;
        break;
      }
    }
    if (found < 0) {
      index += 1;
      continue;
    }
    let start = index;
    let end = found;
    while (
      start + 1 < end &&
      leaksInAssistantText(sliceText(words, start + 1, end), canary).length > 0
    ) {
      start += 1;
    }
    while (
      end - 1 > start &&
      leaksInAssistantText(sliceText(words, start, end - 1), canary).length > 0
    ) {
      end -= 1;
    }
    const hits = leaksInAssistantText(sliceText(words, start, end), canary);
    const smaller =
      end - 1 > start ? leaksInAssistantText(sliceText(words, start, end - 1), canary) : [];
    if (hits.length > 0 && !sameHits(hits, smaller)) {
      for (let cursor = start; cursor < end; cursor += 1) kill[cursor] = true;
    }
    index = end;
  }

  let redacted = text;
  for (let cursor = words.length - 1; cursor >= 0; cursor -= 1) {
    if (!kill[cursor]) continue;
    const word = words[cursor];
    if (!word) continue;
    redacted =
      redacted.slice(0, word.start) + BLOCK.repeat(word.raw.length) + redacted.slice(word.end);
  }
  return maskContacts(redacted);
}

/**
 * Replace canary spans with block characters, then emails and phone-like
 * numbers, then escape the result for HTML. Transcripts are untrusted.
 */
export function redactPublicText(text: string, canary: Canary): string {
  return escapeText(redactSecrets(text, canary));
}
