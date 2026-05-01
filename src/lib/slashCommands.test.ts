import { describe, expect, it } from "vitest";
import { filterSlashCommands, nextSlashIndex } from "./slashCommands";

describe("slash commands", () => {
  it("filters commands by query", () => {
    expect(filterSlashCommands("i")).toEqual(["italic"]);
    expect(filterSlashCommands("")).toEqual(["bold", "italic", "underline", "link"]);
  });

  it("wraps selected menu index", () => {
    expect(nextSlashIndex(0, "up", 4)).toBe(3);
    expect(nextSlashIndex(3, "down", 4)).toBe(0);
  });
});
