import type { JSONContent } from "@tiptap/core";
import { nanoid } from "nanoid";
import { create } from "zustand";
import { createDefaultAppState, createDefaultTab, EMPTY_DOC } from "../lib/defaults";
import type { AppMode, AppState, ArchivedItem, Item, Tab } from "../lib/types";
import { loadNotes, saveNotes } from "./persist";
import { useSettingsStore } from "./settings";

type NotesStore = AppState & {
  cursorIndex: number;
  mode: AppMode;
  archiveOpen: boolean;
  editingTabId: string | null;
  selectedItemIds: string[];
  draggingItemIds: string[];
  dropTargetTabId: string | null;
  itemDropTarget: ItemDropTarget | null;
  hydrated: boolean;
  hydrateNotes: () => Promise<void>;
  createTab: () => void;
  deleteTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  setEditingTabId: (id: string | null) => void;
  reorderTab: (id: string, direction: "left" | "right") => void;
  updateTabTitle: (id: string, title: string) => void;
  createItem: (position: "above" | "below") => void;
  updateItemContent: (tabId: string, itemId: string, content: JSONContent) => void;
  deleteItem: (tabId: string, itemId: string) => void;
  moveItemsToTab: (itemIds: string[], targetTabId: string) => void;
  moveSelectedItemsToTab: (targetTabId: string) => void;
  setSelectedItemIds: (itemIds: string[]) => void;
  toggleItemSelection: (itemId: string) => void;
  clearSelectedItems: () => void;
  startItemDrag: (itemIds: string[]) => void;
  setDropTargetTabId: (tabId: string | null) => void;
  setItemDropTarget: (target: ItemDropTarget | null) => void;
  finishItemDrag: (targetTabId: string | null) => void;
  finishItemDragAtItem: (target: ItemDropTarget | null) => void;
  cancelItemDrag: () => void;
  checkItem: (tabId: string, itemId: string) => void;
  restoreItem: (archivedId: string, destination: "original" | "current" | string) => void;
  deleteArchivedItem: (archivedId: string) => void;
  clearArchive: () => void;
  setCursorIndex: (index: number) => void;
  moveCursor: (direction: "up" | "down") => void;
  setMode: (mode: AppMode) => void;
  setArchiveOpen: (open: boolean) => void;
};

type ItemDropTarget = {
  tabId: string;
  itemId: string;
  position: "before" | "after";
};

const initialState = createDefaultAppState();

export const useNotesStore = create<NotesStore>((set, get) => ({
  ...initialState,
  cursorIndex: -1,
  mode: "nav",
  archiveOpen: false,
  editingTabId: null,
  selectedItemIds: [],
  draggingItemIds: [],
  dropTargetTabId: null,
  itemDropTarget: null,
  hydrated: false,
  hydrateNotes: async () => {
    const state = await loadNotes();
    set({ ...state, cursorIndex: cursorForTab(activeTab(state)), hydrated: true });
  },
  createTab: () => {
    const tab = createDefaultTab();

    commit(set, get, (state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
      cursorIndex: -1,
      editingTabId: tab.id,
      selectedItemIds: [],
    }));
  },
  deleteTab: (id) => {
    commit(set, get, (state) => {
      const deletedIndex = state.tabs.findIndex((tab) => tab.id === id);

      if (deletedIndex === -1) {
        return {};
      }

      const remainingTabs = state.tabs.filter((tab) => tab.id !== id);
      const tabs = remainingTabs.length > 0 ? remainingTabs : [createDefaultTab()];
      const nextIndex = Math.max(0, deletedIndex - 1);
      const activeTabId = state.activeTabId === id ? tabs[Math.min(nextIndex, tabs.length - 1)].id : state.activeTabId;
      const archive = state.archive.map((item) =>
        item.sourceTabId === id ? { ...item, sourceTabExists: false } : item,
      );

      return {
        tabs,
        activeTabId,
        archive,
        cursorIndex: cursorForTab(tabs.find((tab) => tab.id === activeTabId)),
        selectedItemIds: [],
      };
    });
  },
  setActiveTab: (id) => {
    const tab = get().tabs.find((entry) => entry.id === id);

    if (!tab) {
      return;
    }

    set({ activeTabId: id, cursorIndex: cursorForTab(tab), selectedItemIds: [] });
  },
  setEditingTabId: (editingTabId) => set({ editingTabId }),
  reorderTab: (id, direction) => {
    commit(set, get, (state) => {
      const index = state.tabs.findIndex((tab) => tab.id === id);
      const target = direction === "left" ? index - 1 : index + 1;

      if (index === -1 || target < 0 || target >= state.tabs.length) {
        return {};
      }

      const tabs = [...state.tabs];
      const [tab] = tabs.splice(index, 1);
      tabs.splice(target, 0, tab);

      return { tabs };
    });
  },
  updateTabTitle: (id, title) => {
    commit(set, get, (state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, title: normalizeTitle(title) } : tab)),
      editingTabId: state.editingTabId === id ? null : state.editingTabId,
    }));
  },
  createItem: (position) => {
    const state = get();
    const tab = activeTab(state);
    const itemLimit = useSettingsStore.getState().itemLimit;

    if (!tab || tab.items.length >= itemLimit) {
      return;
    }

    const cursorIndex = state.cursorIndex === -1 ? 0 : state.cursorIndex + (position === "below" ? 1 : 0);
    const item = createItemModel();

    commit(set, get, (current) => ({
      tabs: current.tabs.map((entry) =>
        entry.id === tab.id ? { ...entry, items: insertAt(entry.items, cursorIndex, item) } : entry,
      ),
      cursorIndex,
      mode: "edit",
    }));
  },
  updateItemContent: (tabId, itemId, content) => {
    commit(set, get, (state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === tabId
          ? { ...tab, items: tab.items.map((item) => (item.id === itemId ? { ...item, content } : item)) }
          : tab,
      ),
    }));
  },
  deleteItem: (tabId, itemId) => {
    commit(set, get, (state) => removeItemState(state, tabId, itemId));
  },
  moveItemsToTab: (itemIds, targetTabId) => {
    commit(set, get, (state) => buildMoveItemsState(state, itemIds, targetTabId));
  },
  moveSelectedItemsToTab: (targetTabId) => {
    commit(set, get, (state) => buildMoveItemsState(state, state.selectedItemIds, targetTabId));
  },
  setSelectedItemIds: (selectedItemIds) => set({ selectedItemIds }),
  toggleItemSelection: (itemId) => {
    set((state) => {
      const selected = new Set(state.selectedItemIds);

      if (selected.has(itemId)) {
        selected.delete(itemId);
      } else {
        selected.add(itemId);
      }

      return { selectedItemIds: [...selected], mode: "nav" };
    });
  },
  clearSelectedItems: () => set({ selectedItemIds: [] }),
  startItemDrag: (draggingItemIds) => set({ draggingItemIds, dropTargetTabId: null, itemDropTarget: null, mode: "nav" }),
  setDropTargetTabId: (dropTargetTabId) => set({ dropTargetTabId }),
  setItemDropTarget: (itemDropTarget) => set({ itemDropTarget }),
  finishItemDrag: (targetTabId) => {
    if (!targetTabId) {
      set({ draggingItemIds: [], dropTargetTabId: null, itemDropTarget: null });
      return;
    }

    commit(set, get, (state) => ({
      ...buildMoveItemsState(state, state.draggingItemIds, targetTabId),
      draggingItemIds: [],
      dropTargetTabId: null,
      itemDropTarget: null,
    }));
  },
  finishItemDragAtItem: (target) => {
    if (!target) {
      set({ draggingItemIds: [], dropTargetTabId: null, itemDropTarget: null });
      return;
    }

    commit(set, get, (state) => ({
      ...buildReorderItemsState(state, state.draggingItemIds, target),
      draggingItemIds: [],
      dropTargetTabId: null,
      itemDropTarget: null,
    }));
  },
  cancelItemDrag: () => set({ draggingItemIds: [], dropTargetTabId: null, itemDropTarget: null }),
  checkItem: (tabId, itemId) => {
    commit(set, get, (state) => {
      const tab = state.tabs.find((entry) => entry.id === tabId);
      const item = tab?.items.find((entry) => entry.id === itemId);

      if (!tab || !item) {
        return {};
      }

      const archived: ArchivedItem = {
        id: item.id,
        content: item.content,
        archivedAt: Date.now(),
        sourceTabId: tab.id,
        sourceTabTitle: tab.title,
        sourceTabExists: true,
      };

      return {
        ...removeItemState(state, tabId, itemId),
        archive: [...state.archive, archived],
      };
    });
  },
  restoreItem: (archivedId, destination) => {
    commit(set, get, (state) => {
      const archived = state.archive.find((item) => item.id === archivedId);

      if (!archived) {
        return {};
      }

      const restored = restoreArchivedItem(archived);
      const archive = state.archive.filter((item) => item.id !== archivedId);

      if (destination === "original" && archived.sourceTabExists) {
        return restoreToExistingTab(state, archived.sourceTabId, restored, archive);
      }

      if (destination === "original") {
        return {};
      }

      if (destination === "current") {
        return restoreToExistingTab(state, state.activeTabId, restored, archive);
      }

      const tab = { ...createDefaultTab(destination || archived.sourceTabTitle), items: [restored] };

      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
        archive,
        archiveOpen: false,
        cursorIndex: 0,
      };
    });
  },
  deleteArchivedItem: (archivedId) => {
    commit(set, get, (state) => ({
      archive: state.archive.filter((item) => item.id !== archivedId),
    }));
  },
  clearArchive: () => {
    commit(set, get, () => ({ archive: [] }));
  },
  setCursorIndex: (index) => {
    set((state) => ({ cursorIndex: clampCursor(index, activeTab(state)) }));
  },
  moveCursor: (direction) => {
    set((state) => {
      const tab = activeTab(state);

      if (!tab || tab.items.length === 0) {
        return { cursorIndex: -1 };
      }

      const offset = direction === "down" ? 1 : -1;
      const cursorIndex = (state.cursorIndex + offset + tab.items.length) % tab.items.length;

      return { cursorIndex };
    });
  },
  setMode: (mode) => set({ mode }),
  setArchiveOpen: (archiveOpen) => set({ archiveOpen }),
}));

function commit(
  set: (partial: Partial<NotesStore> | ((state: NotesStore) => Partial<NotesStore>)) => void,
  get: () => NotesStore,
  recipe: (state: NotesStore) => Partial<NotesStore>,
) {
  set((state) => recipe(state));
  void saveNotes(toAppState(get()));
}

function toAppState(state: NotesStore): AppState {
  return {
    tabs: state.tabs,
    activeTabId: state.activeTabId,
    archive: state.archive,
  };
}

function activeTab(state: Pick<AppState, "tabs" | "activeTabId">): Tab | undefined {
  return state.tabs.find((tab) => tab.id === state.activeTabId);
}

function cursorForTab(tab: Tab | undefined): number {
  return tab && tab.items.length > 0 ? 0 : -1;
}

function clampCursor(index: number, tab: Tab | undefined) {
  if (!tab || tab.items.length === 0) {
    return -1;
  }

  return Math.min(Math.max(index, 0), tab.items.length - 1);
}

function normalizeTitle(title: string) {
  const trimmed = title.trim().slice(0, 40);
  return trimmed.length > 0 ? trimmed : "Untitled";
}

function createItemModel(): Item {
  return {
    id: nanoid(10),
    content: structuredClone(EMPTY_DOC),
    state: "active",
    createdAt: Date.now(),
  };
}

function insertAt<T>(items: T[], index: number, item: T): T[] {
  const next = [...items];
  next.splice(index, 0, item);
  return next;
}

function removeItemState(state: NotesStore, tabId: string, itemId: string): Partial<NotesStore> {
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

function buildMoveItemsState(state: NotesStore, itemIds: string[], targetTabId: string): Partial<NotesStore> {
  const targetTab = state.tabs.find((tab) => tab.id === targetTabId);
  const selected = new Set(itemIds);

  if (!targetTab || selected.size === 0) {
    return {};
  }

  const movableItems = state.tabs.flatMap((tab) => tab.items.filter((item) => selected.has(item.id)));

  if (movableItems.length === 0 || movableItems.every((item) => targetTab.items.some((target) => target.id === item.id))) {
    return { selectedItemIds: [], mode: "nav" };
  }

  const itemLimit = useSettingsStore.getState().itemLimit;
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

function buildReorderItemsState(state: NotesStore, itemIds: string[], target: ItemDropTarget): Partial<NotesStore> {
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

function insertManyAt<T>(items: T[], index: number, entries: T[]): T[] {
  const next = [...items];
  next.splice(index, 0, ...entries);
  return next;
}

function restoreArchivedItem(archived: ArchivedItem): Item {
  return {
    id: archived.id,
    content: archived.content,
    state: "active",
    createdAt: Date.now(),
  };
}

function restoreToExistingTab(state: NotesStore, tabId: string, item: Item, archive: ArchivedItem[]): Partial<NotesStore> {
  return {
    tabs: state.tabs.map((tab) => (tab.id === tabId ? { ...tab, items: [item, ...tab.items] } : tab)),
    activeTabId: tabId,
    archive,
    archiveOpen: false,
    cursorIndex: 0,
  };
}
