import { describe, expect, it } from "vitest";
import { buildSlashItems, filterSlashCommands, nextSlashIndex } from "./slashCommands";

describe("slash commands", () => {
  it("filters commands by query", () => {
    expect(filterSlashCommands("b")).toEqual([]);
    expect(filterSlashCommands("li")).toEqual([]);
    expect(filterSlashCommands("")).toEqual(["link"]);
    expect(filterSlashCommands("link")).toEqual(["link"]);
  });

  it("wraps selected menu index", () => {
    expect(nextSlashIndex(0, "up", 4)).toBe(3);
    expect(nextSlashIndex(3, "down", 4)).toBe(0);
  });

  it("adds existing tags and a create tag item to slash suggestions", () => {
    const items = buildSlashItems("wo", [{ name: "work", color: "#4f8ef7" }]);

    expect(items.map((item) => item.kind)).toEqual(["tag", "create-tag"]);
    expect(items.map((item) => item.label)).toEqual(["work", "wo"]);
  });

  it("reserves exact link queries for the link command", () => {
    const items = buildSlashItems("link", [{ name: "linkable", color: "#4f8ef7" }]);

    expect(items.map((item) => item.kind)).toEqual(["command", "tag"]);
  });

  it("creates a tag for partial link text instead of selecting the link command", () => {
    const items = buildSlashItems("li", []);

    expect(items).toEqual([
      {
        id: "create-tag:li",
        kind: "create-tag",
        name: "li",
        label: "li",
        description: "Create tag",
      },
    ]);
  });
});
