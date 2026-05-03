export const ITEM_DRAG_MIME = "application/x-nota-items";

type ItemDragPayload = {
  itemIds: string[];
};

export function createItemDragPayload(itemIds: string[]) {
  return JSON.stringify({ itemIds });
}

export function parseItemDragPayload(value: string) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }

    if (isDragPayload(parsed)) {
      return parsed.itemIds;
    }
  } catch {
    return [];
  }

  return [];
}

function isDragPayload(value: unknown): value is ItemDragPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as ItemDragPayload).itemIds) &&
    (value as ItemDragPayload).itemIds.every((item) => typeof item === "string")
  );
}
