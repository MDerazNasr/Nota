import { describe, expect, it } from "vitest";
import { formatShortcut } from "./shortcuts";

describe("formatShortcut", () => {
  it("formats modified letter shortcuts", () => {
    expect(formatShortcut({ altKey: false, ctrlKey: false, key: "n", metaKey: true, shiftKey: true })).toBe(
      "CommandOrControl+Shift+N",
    );
  });

  it("ignores bare modifiers", () => {
    expect(formatShortcut({ altKey: false, ctrlKey: false, key: "Shift", metaKey: false, shiftKey: true })).toBe("");
  });

  it("normalizes space", () => {
    expect(formatShortcut({ altKey: true, ctrlKey: false, key: " ", metaKey: false, shiftKey: false })).toBe(
      "Alt+Space",
    );
  });
});
