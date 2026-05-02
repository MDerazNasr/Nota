import { describe, expect, it } from "vitest";
import { THEMES } from "./themes";

const REQUIRED_VARIABLES = [
  "--bg",
  "--surface",
  "--surface-hover",
  "--border",
  "--text-primary",
  "--text-secondary",
  "--text-muted",
  "--accent",
  "--accent-muted",
  "--done-opacity",
];

describe("themes", () => {
  it("defines every required CSS variable for each theme", () => {
    expect(Object.keys(THEMES).length).toBeGreaterThanOrEqual(18);

    Object.values(THEMES).forEach((theme) => {
      REQUIRED_VARIABLES.forEach((variable) => {
        expect(theme.variables[variable], `${theme.name} is missing ${variable}`).toBeTruthy();
      });
    });
  });
});
