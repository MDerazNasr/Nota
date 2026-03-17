import { describe, expect, it } from "vitest";
import { createItemDragPayload, parseItemDragPayload } from "./itemDrag";

describe("item drag payload", () => {
  it("round trips item ids", () => {
    expect(parseItemDragPayload(createItemDragPayload(["a", "b"]))).toEqual(["a", "b"]);
  });

  it("keeps compatibility with the old array payload", () => {
    expect(parseItemDragPayload(JSON.stringify(["a"]))).toEqual(["a"]);
  });

  it("returns an empty list for invalid payloads", () => {
    expect(parseItemDragPayload("not-json")).toEqual([]);
  });
});
