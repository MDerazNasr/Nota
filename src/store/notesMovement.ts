import type { AppState, Item } from "../lib/types";

export type MovementMode = "nav" | "edit" | "move" | "tabs" | "tab-move";

export type ItemDropTarget = {
  tabId: string;
  itemId: string;
  position: "before" | "after";
};

export type MovementState = AppState & {
  cursorIndex: number;
  mode: MovementMode;
  selectedItemIds: string[];
};

export function buildMoveItemsState(
  state: MovementState,
  itemIds: string[],
  targetTabId: string,
  itemLimit: number,
): Partial<MovementState> {
  const targetTab = state.tabs.find((tab) => tab.id === targetTabId);
  const selected = new Set(itemIds);

  if (!targetTab || selected.size === 0) {
    return {};
  }

  const movableItems = state.tabs.flatMap((tab) => tab.items.filter((item) => selected.has(item.id)));

  if (movableItems.length === 0 || movableItems.every((item) => targetTab.items.some((target) => target.id === item.id))) {
    return { selectedItemIds: [], mode: "nav" };
  }

  const targetSelectedCount = targetTab.items.filter((item) => selected.has(item.id)).length;
  const capacity = Math.max(0, itemLimit - targetTab.items.length + targetSelectedCount);
  const itemsToMove = movableItems.slice(0, capacity);

  if (itemsToMove.length === 0) {
    return {};
  }

  const movedIds = new Set(itemsToMove.map((item) => item.id));
  const insertionIndex = targetTab.items.filter((item) => !movedIds.has(item.id)).length;
  const tabs = state.tabs.map((tab) => {
    const remainingItems = tab.items.filter((item) => !movedIds.has(item.id));

    if (tab.id === targetTabId) {
      return {
        ...tab,
        items: [...remainingItems, ...itemsToMove],
      };
    }

    return {
      ...tab,
      items: remainingItems,
    };
  });

  return {
    tabs,
    activeTabId: targetTabId,
    cursorIndex: insertionIndex,
    selectedItemIds: [],
    mode: "nav",
  };
}

export function buildReorderItemsState(
  state: MovementState,
  itemIds: string[],
  target: ItemDropTarget,
): Partial<MovementState> {
  const targetTab = state.tabs.find((tab) => tab.id === target.tabId);
  const selected = new Set(itemIds);

  if (!targetTab || selected.size === 0 || selected.has(target.itemId)) {
    return { selectedItemIds: [], mode: "nav" };
  }

  const itemsToMove = targetTab.items.filter((item) => selected.has(item.id));

  if (itemsToMove.length === 0) {
    return {};
  }

  const remainingItems = targetTab.items.filter((item) => !selected.has(item.id));
  const targetIndex = remainingItems.findIndex((item) => item.id === target.itemId);

  if (targetIndex === -1) {
    return {};
  }

  const insertionIndex = targetIndex + (target.position === "after" ? 1 : 0);
  const nextItems = insertManyAt(remainingItems, insertionIndex, itemsToMove);

  return {
    tabs: state.tabs.map((tab) => (tab.id === target.tabId ? { ...tab, items: nextItems } : tab)),
    activeTabId: target.tabId,
    cursorIndex: insertionIndex,
    selectedItemIds: [],
    mode: "nav",
  };
}

export function reorderSelectedItems(
  state: MovementState,
  direction: "up" | "down",
): Partial<MovementState> {
  const tab = state.tabs.find((entry) => entry.id === state.activeTabId);
  const selected = new Set(state.selectedItemIds);

  if (!tab || selected.size === 0) {
    return {};
  }

  const nextItems = direction === "up" ? moveSelectedUp(tab.items, selected) : moveSelectedDown(tab.items, selected);
  const firstSelectedIndex = nextItems.findIndex((item) => selected.has(item.id));

  return {
    tabs: state.tabs.map((entry) => (entry.id === tab.id ? { ...entry, items: nextItems } : entry)),
    cursorIndex: firstSelectedIndex,
    mode: "move",
  };
}

export function buildMoveSelectionState(
  state: MovementState & { selectionAnchorId: string | null },
  direction: "up" | "down",
  range: boolean,
): Partial<MovementState & { selectionAnchorId: string | null }> {
  const tab = state.tabs.find((entry) => entry.id === state.activeTabId);

  if (!tab || tab.items.length === 0) {
    return {};
  }

  const offset = direction === "down" ? 1 : -1;
  const nextIndex = clampCursor(state.cursorIndex + offset, tab.items.length);
  const nextItem = tab.items[nextIndex];

  if (!nextItem) {
    return {};
  }

  if (!range) {
    const selected = new Set(state.selectedItemIds);

    if (selected.has(nextItem.id)) {
      selected.delete(nextItem.id);
    } else {
      selected.add(nextItem.id);
    }

    return {
      cursorIndex: nextIndex,
      selectedItemIds: [...selected],
      selectionAnchorId: state.selectionAnchorId ?? nextItem.id,
      mode: "move",
    };
  }

  const anchorId = state.selectionAnchorId ?? state.selectedItemIds[0] ?? nextItem.id;
  const anchorIndex = Math.max(0, tab.items.findIndex((item) => item.id === anchorId));
  const [start, end] = anchorIndex < nextIndex ? [anchorIndex, nextIndex] : [nextIndex, anchorIndex];

  return {
    cursorIndex: nextIndex,
    selectedItemIds: tab.items.slice(start, end + 1).map((item) => item.id),
    selectionAnchorId: anchorId,
    mode: "move",
  };
}

function clampCursor(index: number, itemCount: number) {
  if (itemCount === 0) {
    return -1;
  }

  return Math.min(Math.max(index, 0), itemCount - 1);
}

function moveSelectedUp(items: Item[], selected: Set<string>) {
  const next = [...items];

  for (let index = 1; index < next.length; index += 1) {
    if (selected.has(next[index].id) && !selected.has(next[index - 1].id)) {
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
    }
  }

  return next;
}

function moveSelectedDown(items: Item[], selected: Set<string>) {
  const next = [...items];

  for (let index = next.length - 2; index >= 0; index -= 1) {
    if (selected.has(next[index].id) && !selected.has(next[index + 1].id)) {
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
    }
  }

  return next;
}

function insertManyAt<T>(items: T[], index: number, entries: T[]): T[] {
  const next = [...items];
  next.splice(index, 0, ...entries);
  return next;
}
