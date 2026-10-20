import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { adminAccess, tokenDigest, tokenMatches } from "../lib/admin-auth";
import { AdminUnconfigured } from "../components/admin-panel";

const saved = process.env.ADMIN_TOKEN;

afterEach(() => {
  if (saved === undefined) delete process.env.ADMIN_TOKEN;
  else process.env.ADMIN_TOKEN = saved;
});

describe("admin auth", () => {
  it("fails closed when ADMIN_TOKEN is unset or blank", () => {
    delete process.env.ADMIN_TOKEN;
    expect(adminAccess(undefined)).toBe("unconfigured");
    expect(adminAccess("anything")).toBe("unconfigured");
    process.env.ADMIN_TOKEN = "   ";
    expect(adminAccess(undefined)).toBe("unconfigured");
    const html = renderToStaticMarkup(createElement(AdminUnconfigured));
    expect(html).toContain("Admin is not configured.");
    expect(html).not.toContain("Unlink returned");
    expect(html).not.toContain("type=\"password\"");
  });

  it("rejects a missing or wrong cookie when a token is set", () => {
    process.env.ADMIN_TOKEN = "local-admin-secret";
    expect(adminAccess(undefined)).toBe("unauthorized");
    expect(adminAccess(tokenDigest("other-secret"))).toBe("unauthorized");
    expect(tokenMatches("local-admin-secret", "local-admin-secret")).toBe(true);
    expect(tokenMatches("local-admin-secret", "nope")).toBe(false);
  });

  it("accepts only the digest of the configured token", () => {
    process.env.ADMIN_TOKEN = "local-admin-secret";
    expect(adminAccess(tokenDigest("local-admin-secret"))).toBe("ready");
  });
});
