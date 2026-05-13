import type { Item } from "./types";

export type ViewportTarget = "top" | "middle" | "bottom";

export function itemIndexForViewportTarget(items: Item[], target: ViewportTarget) {
  const list = document.querySelector<HTMLElement>(".item-list");
  const rows = [...document.querySelectorAll<HTMLElement>(".item-row[data-item-id]")];

  if (!list || rows.length === 0) {
    return null;
  }

  const listRect = list.getBoundingClientRect();
  const visibleRows = rows
    .map((row) => ({ row, rect: row.getBoundingClientRect() }))
    .filter(({ rect }) => rect.bottom > listRect.top && rect.top < listRect.bottom);

  if (visibleRows.length === 0) {
    return null;
  }

  const row =
    target === "top"
      ? visibleRows[0].row
      : target === "bottom"
        ? visibleRows[visibleRows.length - 1].row
        : rowClosestToMiddle(visibleRows, listRect).row;
  const itemId = row.dataset.itemId;
  const index = items.findIndex((item) => item.id === itemId);

  return index >= 0 ? index : null;
}

function rowClosestToMiddle(
  rows: Array<{ row: HTMLElement; rect: DOMRect }>,
  listRect: DOMRect,
) {
  const middle = listRect.top + listRect.height / 2;

  return rows.reduce((closest, current) => {
    const closestDistance = Math.abs(rowMiddle(closest.rect) - middle);
    const currentDistance = Math.abs(rowMiddle(current.rect) - middle);
    return currentDistance < closestDistance ? current : closest;
  });
}

function rowMiddle(rect: DOMRect) {
  return rect.top + rect.height / 2;
}
