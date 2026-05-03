const NON_DRAG_SELECTOR = "button, input, select, textarea, a, [role='button'], [contenteditable='true']";

export function shouldStartWindowDrag(target: EventTarget | null, currentTarget: EventTarget | null) {
  if (!(target instanceof HTMLElement) || !(currentTarget instanceof HTMLElement)) {
    return false;
  }

  if (!currentTarget.contains(target)) {
    return false;
  }

  return target.closest(NON_DRAG_SELECTOR) === null;
}
