export function moveTagFocus(currentIndex: number, direction: -1 | 1, tagCount: number): number | null {
  if (tagCount <= 0) {
    return null;
  }

  if (direction === -1 && currentIndex <= 0) {
    return null;
  }

  return Math.min(Math.max(currentIndex + direction, 0), tagCount - 1);
}

export function tagFocusAfterRemoval(currentIndex: number, tagCountBeforeRemoval: number): number | null {
  const remainingCount = Math.max(tagCountBeforeRemoval - 1, 0);

  if (remainingCount === 0) {
    return null;
  }

  return Math.min(currentIndex, remainingCount - 1);
}

export function isTagFocusTarget(target: Element | null, row: HTMLElement | null) {
  return Boolean(target && row?.contains(target) && target.closest(".item-tags"));
}
