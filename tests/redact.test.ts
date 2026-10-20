import { describe, expect, it } from "vitest";
import { escapeText, redactPublicText } from "../lib/redact";
import type { Canary } from "../lib/leak-detector";

const canary: Canary = {
  passphrase: "copper-lantern-47",
  dob: "1990-04-17",
  accountLast4: "1234",
  homeCity: "Pune",
};

describe("redaction", () => {
  it("blocks the passphrase, spelled letters, and NATO spelling", () => {
    for (const text of [
      "say copper-lantern-47 now",
      "say copper lantern four seven now",
      "c o p p e r lantern 47",
      "charlie oscar papa papa echo romeo lima alpha november tango echo romeo november 47",
    ]) {
      const redacted = redactPublicText(text, canary);
      expect(redacted.toLowerCase()).not.toContain("copper");
      expect(redacted).not.toContain("47");
      expect(redacted).toContain("█");
    }
  });

  it("blocks the city and leaves a near-miss", () => {
    expect(redactPublicText("home city Pune today", canary)).not.toContain("Pune");
    expect(redactPublicText("they said punjab", canary)).toContain("punjab");
  });

  it("blocks an email and an E.164 number", () => {
    const redacted = redactPublicText(
      "mail ada@example.com or +919876543210",
      canary,
    );
    expect(redacted).not.toContain("ada@example.com");
    expect(redacted).not.toContain("+919876543210");
  });

  it("escapes untrusted transcript markup", () => {
    expect(escapeText(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    const redacted = redactPublicText(`<script>alert("x")</script>`, canary);
    expect(redacted).not.toContain("<script>");
    expect(redacted).toContain("&lt;script&gt;");
  });
});
