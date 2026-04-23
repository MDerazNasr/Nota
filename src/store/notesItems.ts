import { nanoid } from "nanoid";
import { createDefaultTab, EMPTY_DOC } from "../lib/defaults";
import type { AppState, ArchivedItem, Item, Tab } from "../lib/types";
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
  archiveCompletedItems: boolean,
): Partial<ItemMutationState> {
  if (archiveCompletedItems) {
    return archiveItemState(state, tabId, itemId);
  }

  return toggleDoneItemState(state, tabId, itemId);
}

function archiveItemState(state: ItemMutationState, tabId: string, itemId: string): Partial<ItemMutationState> {
  const tab = state.tabs.find((entry) => entry.id === tabId);
  const item = tab?.items.find((entry) => entry.id === itemId);

  if (!tab || !item) {
    return {};
  }

  const archived: ArchivedItem = {
    id: item.id,
    content: item.content,
    tags: item.tags,
    archivedAt: Date.now(),
    sourceTabId: tab.id,
    sourceTabTitle: tab.title,
    sourceTabExists: true,
  };

  return {
    ...removeItemState(state, tabId, itemId),
    archive: [...state.archive, archived],
  };
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

export function restoreArchivedItem(archived: ArchivedItem): Item {
  return {
    id: archived.id,
    content: archived.content,
    state: "active",
    tags: archived.tags ?? [],
    createdAt: Date.now(),
  };
}

export function restoreToExistingTab(state: AppState, tabId: string, item: Item, archive: ArchivedItem[]) {
  return {
    tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, items: [item, ...tab.items] } : tab)),
    activeTabId: tabId,
    archive,
    archiveOpen: false,
    cursorIndex: 0,
  };
}

export function createRestoredTab(title: string, item: Item): Tab {
  return { ...createDefaultTab(title), items: [item] };
}
