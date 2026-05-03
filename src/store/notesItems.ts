import { nanoid } from "nanoid";
import { EMPTY_DOC } from "../lib/defaults";
import { tagKey } from "../lib/tags";
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

export function sortItemsByTagState(state: ItemMutationState, tabId: string): Partial<ItemMutationState> {
  const tab = state.tabs.find((entry) => entry.id === tabId);

  if (!tab || tab.items.length < 2 || !tab.items.some((item) => item.tags.length > 0)) {
    return {};
  }

  const focusedId = tab.items[state.cursorIndex]?.id ?? null;
  const items = sortItemsByTag(tab.items);
  const cursorIndex = focusedId ? items.findIndex((item) => item.id === focusedId) : clampCursor(state.cursorIndex, { ...tab, items });

  return {
    tabs: state.tabs.map((entry) => (entry.id === tabId ? { ...entry, items } : entry)),
    cursorIndex,
  };
}

function sortItemsByTag(items: Item[]) {
  const counts = tagCounts(items);

  return items
    .map((item, index) => ({ item, index, tag: primarySortTag(item, counts) }))
    .sort((left, right) => {
      // Completed tasks stay last because the crossed out state already uses the list bottom.
      if (left.item.state !== right.item.state) {
        return left.item.state === "done" ? 1 : -1;
      }

      if (!left.tag || !right.tag) {
        return left.tag ? -1 : right.tag ? 1 : left.index - right.index;
      }

      return left.tag.count - right.tag.count || left.tag.key.localeCompare(right.tag.key) || left.index - right.index;
    })
    .map(({ item }) => item);
}

function tagCounts(items: Item[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const keys = new Set(item.tags.map((tag) => tagKey(tag.name)).filter(Boolean));

    for (const key of keys) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return counts;
}

function primarySortTag(item: Item, counts: Map<string, number>) {
  return item.tags
    .map((tag) => {
      const key = tagKey(tag.name);
      return key ? { key, count: counts.get(key) ?? Number.MAX_SAFE_INTEGER } : null;
    })
    .filter((tag): tag is { key: string; count: number } => Boolean(tag))
    .sort((left, right) => left.count - right.count || left.key.localeCompare(right.key))[0] ?? null;
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
