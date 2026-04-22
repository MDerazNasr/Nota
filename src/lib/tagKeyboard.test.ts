import { describe, expect, it } from "vitest";
import { moveTagFocus, tagFocusAfterRemoval } from "./tagKeyboard";

describe("tag keyboard helpers", () => {
  it("moves through tags and returns null when moving left from the first tag", () => {
    expect(moveTagFocus(0, 1, 3)).toBe(1);
    expect(moveTagFocus(2, 1, 3)).toBe(2);
    expect(moveTagFocus(1, -1, 3)).toBe(0);
    expect(moveTagFocus(0, -1, 3)).toBeNull();
  });

  it("keeps focus on the next available tag after removal", () => {
    expect(tagFocusAfterRemoval(0, 2)).toBe(0);
    expect(tagFocusAfterRemoval(2, 3)).toBe(1);
    expect(tagFocusAfterRemoval(0, 1)).toBeNull();
  });
});
