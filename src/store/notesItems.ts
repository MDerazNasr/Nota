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
