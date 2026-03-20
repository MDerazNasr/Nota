import { describe, expect, it } from "vitest";
import { normalizeHref } from "./links";

describe("normalizeHref", () => {
  it("keeps explicit protocols", () => {
    expect(normalizeHref("https://example.com")).toBe("https://example.com");
    expect(normalizeHref("mailto:test@example.com")).toBe("mailto:test@example.com");
  });

  it("adds https to bare domains", () => {
    expect(normalizeHref("example.com")).toBe("https://example.com");
  });
});
