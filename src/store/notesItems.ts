import { nanoid } from "nanoid";
import { EMPTY_DOC } from "../lib/defaults";
import type { AppState, Item } from "../lib/types";
import { clampCursor } from "./notesSelectors";

type ItemMutationState = AppState & {
  cursorIndex: number;
  selectedItemIds: string[];
};

export function createItemModel(): Item {
  return {
    id: nanoid(10),
    content: structuredClone(EMPTY_DOC),
    state: "active",
    tags: [],
    createdAt: Date.now(),
  };
}

export function insertAt<T>(items: T[], index: number, item: T): T[] {
  const next = [...items];
  next.splice(index, 0, item);
  return next;
}

export function removeItemState(state: ItemMutationState, tabId: string, itemId: string): Partial<ItemMutationState> {
  const tab = state.tabs.find((entry) => entry.id === tabId);

  if (!tab) {
    return {};
  }

  const index = tab.items.findIndex((item) => item.id === itemId);

  if (index === -1) {
    return {};
  }

  const tabs = state.tabs.map((entry) =>
    entry.id === tabId ? { ...entry, items: entry.items.filter((item) => item.id !== itemId) } : entry,
  );
  const updatedTab = tabs.find((entry) => entry.id === tabId);

  return {
    tabs,
    cursorIndex: clampCursor(index, updatedTab),
    selectedItemIds: state.selectedItemIds.filter((selectedId) => selectedId !== itemId),
  };
}

export function completeItemState(
  state: ItemMutationState,
  tabId: string,
  itemId: string,
): Partial<ItemMutationState> {
  return toggleDoneItemState(state, tabId, itemId);
}

function toggleDoneItemState(state: ItemMutationState, tabId: string, itemId: string): Partial<ItemMutationState> {
  const tab = state.tabs.find((entry) => entry.id === tabId);
  const index = tab?.items.findIndex((item) => item.id === itemId) ?? -1;
  const item = index >= 0 ? tab?.items[index] : undefined;

  if (!tab || !item) {
    return {};
  }

  const nextItem: Item = { ...item, state: item.state === "done" ? "active" : "done" };
  const items =
    nextItem.state === "done"
      ? [...tab.items.filter((entry) => entry.id !== itemId), nextItem]
      : tab.items.map((entry) => (entry.id === itemId ? nextItem : entry));
  const tabs = state.tabs.map((entry) => (entry.id === tabId ? { ...entry, items } : entry));

  return {
    tabs,
    cursorIndex: items.findIndex((entry) => entry.id === itemId),
  };
}
