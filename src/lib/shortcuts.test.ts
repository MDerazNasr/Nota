import { describe, expect, it } from "vitest";
import { displayShortcut, formatShortcut } from "./shortcuts";

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

  it("uses physical key codes for option-modified letters", () => {
    expect(formatShortcut({ altKey: true, code: "KeyN", ctrlKey: false, key: "Dead", metaKey: false, shiftKey: true })).toBe(
      "Alt+Shift+KeyN",
    );
  });

  it("renders stored shortcuts for display", () => {
    expect(displayShortcut("CommandOrControl+Shift+N")).toBe("Cmd + Shift + N");
    expect(displayShortcut("Alt+Shift+KeyN")).toBe("Opt + Shift + N");
    expect(displayShortcut("")).toBe("Disabled");
  });
});
