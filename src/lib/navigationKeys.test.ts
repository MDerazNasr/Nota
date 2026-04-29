import { describe, expect, it } from "vitest";
import { moveModeHorizontalDirectionForKey, verticalDirectionForKey } from "./navigationKeys";

describe("navigation keys", () => {
  it("maps vim and arrow keys to vertical movement", () => {
    expect(verticalDirectionForKey("j")).toBe("down");
    expect(verticalDirectionForKey("ArrowDown")).toBe("down");
    expect(verticalDirectionForKey("k")).toBe("up");
    expect(verticalDirectionForKey("ArrowUp")).toBe("up");
  });

  it("maps move mode horizontal arrows without changing normal tab navigation", () => {
    expect(moveModeHorizontalDirectionForKey("h")).toBe("left");
    expect(moveModeHorizontalDirectionForKey("ArrowLeft")).toBe("left");
    expect(moveModeHorizontalDirectionForKey("l")).toBe("right");
    expect(moveModeHorizontalDirectionForKey("ArrowRight")).toBe("right");
  });
});
