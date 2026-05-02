import { describe, expect, it, vi } from "vitest";
import { collectActiveTags, createTag, normalizeTagName } from "./tags";
import type { Tab } from "./types";

describe("tags", () => {
  it("normalizes slash-prefixed tag names", () => {
    expect(normalizeTagName(" /work   focus ")).toBe("work focus");
  });

  it("creates a random palette color for a new tag", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.2);

    expect(createTag("work")).toEqual({ name: "work", color: "#22c55e" });
  });

  it("collects tags only from active todo items", () => {
    const tabs: Tab[] = [
      {
        id: "tab-1",
        title: "Inbox",
        createdAt: 1,
        items: [
          {
            id: "item-1",
            content: { type: "doc" },
            state: "active",
            createdAt: 1,
            tags: [{ name: "work", color: "#4f8ef7" }],
          },
        ],
      },
      { id: "tab-2", title: "Later", createdAt: 2, items: [] },
    ];

    expect(collectActiveTags(tabs)).toEqual([{ name: "work", color: "#4f8ef7" }]);
    expect(collectActiveTags([{ ...tabs[0], items: [] }])).toEqual([]);
  });
});
