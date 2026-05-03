import { describe, expect, it } from "vitest";
import { moveSettingsFocus, moveSettingsTab } from "./settingsNav";

describe("moveSettingsTab", () => {
  it("moves between settings tabs with wrapping", () => {
    expect(moveSettingsTab("appearance", 1)).toBe("shortcuts");
    expect(moveSettingsTab("shortcuts", 1)).toBe("about");
    expect(moveSettingsTab("about", 1)).toBe("appearance");
    expect(moveSettingsTab("appearance", -1)).toBe("about");
  });
});

describe("moveSettingsFocus", () => {
  it("moves through focusable controls with wrapping", () => {
    expect(moveSettingsFocus(0, 1, 3)).toBe(1);
    expect(moveSettingsFocus(2, 1, 3)).toBe(0);
    expect(moveSettingsFocus(0, -1, 3)).toBe(2);
  });

  it("keeps an empty focus list at zero", () => {
    expect(moveSettingsFocus(4, 1, 0)).toBe(0);
  });
});
