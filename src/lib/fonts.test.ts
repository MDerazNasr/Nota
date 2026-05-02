import { describe, expect, it } from "vitest";
import { FONT_OPTIONS, isFontOption } from "./fonts";

describe("fonts", () => {
  it("keeps a focused set of visually distinct monospace options", () => {
    expect(FONT_OPTIONS).toEqual([
      "JetBrains Mono",
      "SF Mono",
      "IBM Plex Mono",
      "Geist Mono",
      "Fira Code",
      "Iosevka",
      "Inconsolata",
      "Space Mono",
      "Berkeley Mono",
    ]);
  });

  it("rejects removed near-duplicate font options", () => {
    expect(isFontOption("Menlo")).toBe(false);
    expect(isFontOption("Monaco")).toBe(false);
    expect(isFontOption("JetBrains Mono")).toBe(true);
  });
});
