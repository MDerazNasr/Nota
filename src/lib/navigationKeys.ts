export type VerticalDirection = "down" | "up";
export type HorizontalDirection = "left" | "right";

export function verticalDirectionForKey(key: string): VerticalDirection | null {
  if (key === "j") {
    return "down";
  }

  if (key === "k") {
    return "up";
  }

  return null;
}

export function moveModeHorizontalDirectionForKey(key: string): HorizontalDirection | null {
  if (key === "h" || key === "ArrowLeft") {
    return "left";
  }

  if (key === "l" || key === "ArrowRight") {
    return "right";
  }

  return null;
}
