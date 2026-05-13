import { describe, expect, it } from "vitest";
import { itemIndexForViewportTarget } from "./itemViewport";
import type { Item } from "./types";

function item(id: string): Item {
  return {
    id,
    content: { type: "doc" },
    createdAt: 0,
    state: "active",
    tags: [],
  };
}

function addRow(id: string, top: number, bottom: number) {
  const row = document.createElement("article");
  row.className = "item-row";
  row.dataset.itemId = id;
  row.getBoundingClientRect = () => ({ bottom, height: bottom - top, left: 0, right: 100, top, width: 100, x: 0, y: top, toJSON: () => ({}) });
  document.body.append(row);
}

describe("item viewport targeting", () => {
  it("finds top middle and bottom visible item indexes", () => {
    const list = document.createElement("section");
    list.className = "item-list";
    list.getBoundingClientRect = () => ({ bottom: 300, height: 300, left: 0, right: 100, top: 0, width: 100, x: 0, y: 0, toJSON: () => ({}) });
    document.body.replaceChildren(list);

    addRow("a", -50, -10);
    addRow("b", 10, 40);
    addRow("c", 120, 160);
    addRow("d", 260, 290);

    const items = ["a", "b", "c", "d"].map(item);

    expect(itemIndexForViewportTarget(items, "top")).toBe(1);
    expect(itemIndexForViewportTarget(items, "middle")).toBe(2);
    expect(itemIndexForViewportTarget(items, "bottom")).toBe(3);
  });
});
