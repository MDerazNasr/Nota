import { describe, expect, it } from "vitest";
import { shouldStartWindowDrag } from "./windowDrag";

describe("shouldStartWindowDrag", () => {
  it("allows dragging from plain title bar space", () => {
    const titleBar = document.createElement("header");
    const label = document.createElement("span");
    titleBar.append(label);

    expect(shouldStartWindowDrag(label, titleBar)).toBe(true);
  });

  it("does not drag from title bar controls", () => {
    const titleBar = document.createElement("header");
    const button = document.createElement("button");
    titleBar.append(button);

    expect(shouldStartWindowDrag(button, titleBar)).toBe(false);
  });
});
