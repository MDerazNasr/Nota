import type { JSONContent } from "@tiptap/core";
import { create } from "zustand";
import { createDefaultAppState, createDefaultTab } from "../lib/defaults";
import { collectActiveTags, createTag, findTagByName, normalizeTagName, tagKey } from "../lib/tags";
import type { AppMode, AppState } from "../lib/types";
import { commit } from "./notesCommit";
import {
  completeItemState,
  createItemModel,
  createRestoredTab,
  insertAt,
  removeItemState,
  restoreArchivedItem,
  restoreToExistingTab,
} from "./notesItems";
import {
  buildMoveSelectionState,
  buildMoveItemsState,
  buildReorderItemsState,
  reorderSelectedItems,
  type ItemDropTarget,
} from "./notesMovement";
import { activeTab, clampCursor, cursorForTab, normalizeTitle } from "./notesSelectors";
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
  selectionAnchorId: string | null;
  undoStack: AppState[];
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
  addItemTag: (tabId: string, itemId: string, tagName: string) => void;
  removeItemTag: (tabId: string, itemId: string, tagName: string) => void;
  deleteItem: (tabId: string, itemId: string) => void;
  moveItemsToTab: (itemIds: string[], targetTabId: string) => void;
  moveSelectedItemsToTab: (targetTabId: string) => void;
  setSelectedItemIds: (itemIds: string[]) => void;
  toggleItemSelection: (itemId: string) => void;
  enterMoveMode: () => void;
  exitMoveMode: () => void;
  extendMoveSelection: (direction: "up" | "down", range: boolean) => void;
  reorderMoveSelection: (direction: "up" | "down") => void;
  moveSelectionToAdjacentTab: (direction: "left" | "right") => void;
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
  undoLastChange: () => void;
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
  selectionAnchorId: null,
  undoStack: [],
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
      mode: "edit" as const,
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
  addItemTag: (tabId, itemId, tagName) => {
    const normalized = normalizeTagName(tagName);

    if (!normalized || tagKey(normalized) === "link") {
      return;
    }

    commit(set, get, (state) => {
      const existingTag = findTagByName(collectActiveTags(state.tabs), normalized);
      const tag = existingTag ?? createTag(normalized);
      let changed = false;

      const tabs = state.tabs.map((tab) => {
        if (tab.id !== tabId) {
          return tab;
        }

        const items = tab.items.map((item) => {
          if (item.id !== itemId || findTagByName(item.tags ?? [], tag.name)) {
            return item;
          }

          changed = true;
          return { ...item, tags: [...(item.tags ?? []), tag] };
        });

        return changed ? { ...tab, items } : tab;
      });

      return changed ? { tabs } : {};
    });
  },
  removeItemTag: (tabId, itemId, tagName) => {
    const key = tagKey(tagName);

    if (!key) {
      return;
    }

    commit(set, get, (state) => {
      let changed = false;

      const tabs = state.tabs.map((tab) => {
        if (tab.id !== tabId) {
          return tab;
        }

        const items = tab.items.map((item) => {
          if (item.id !== itemId || !findTagByName(item.tags ?? [], tagName)) {
            return item;
          }

          changed = true;
          return { ...item, tags: (item.tags ?? []).filter((tag) => tagKey(tag.name) !== key) };
        });

        return changed ? { ...tab, items } : tab;
      });

      return changed ? { tabs } : {};
    });
  },
  deleteItem: (tabId, itemId) => {
    commit(set, get, (state) => removeItemState(state, tabId, itemId));
  },
  moveItemsToTab: (itemIds, targetTabId) => {
    commit(set, get, (state) => buildMoveItemsState(state, itemIds, targetTabId, useSettingsStore.getState().itemLimit));
  },
  moveSelectedItemsToTab: (targetTabId) => {
    commit(set, get, (state) =>
      buildMoveItemsState(state, state.selectedItemIds, targetTabId, useSettingsStore.getState().itemLimit),
    );
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
  enterMoveMode: () => {
    const state = get();
    const tab = activeTab(state);
    const item = tab?.items[state.cursorIndex];

    if (!tab || !item) {
      return;
    }

    const selectedItemIds = state.selectedItemIds.includes(item.id) ? state.selectedItemIds : [item.id];
    set({ mode: "move", selectedItemIds, selectionAnchorId: item.id });
  },
  exitMoveMode: () => set({ mode: "nav", itemDropTarget: null, selectedItemIds: [], selectionAnchorId: null }),
  extendMoveSelection: (direction, range) => {
    set((state) => buildMoveSelectionState(state, direction, range));
  },
  reorderMoveSelection: (direction) => {
    commit(set, get, (state) => reorderSelectedItems(state, direction));
  },
  moveSelectionToAdjacentTab: (direction) => {
    commit(set, get, (state) => {
      const currentIndex = state.tabs.findIndex((tab) => tab.id === state.activeTabId);
      const offset = direction === "right" ? 1 : -1;
      const target = state.tabs[currentIndex + offset];

      if (!target) {
        return {};
      }

      const moved = buildMoveItemsState(state, state.selectedItemIds, target.id, useSettingsStore.getState().itemLimit);
      const movedTab = moved.tabs?.find((tab) => tab.id === target.id);
      const movedIds = state.selectedItemIds.filter((id) => movedTab?.items.some((item) => item.id === id));

      return {
        ...moved,
        mode: "move",
        selectedItemIds: movedIds,
        selectionAnchorId: movedIds[0] ?? null,
      };
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
      ...buildMoveItemsState(state, state.draggingItemIds, targetTabId, useSettingsStore.getState().itemLimit),
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
    commit(set, get, (state) =>
      completeItemState(state, tabId, itemId, useSettingsStore.getState().archiveCompletedItems),
    );
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

      const tab = createRestoredTab(destination || archived.sourceTabTitle, restored);

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
  undoLastChange: () => {
    const previous = get().undoStack.at(-1);

    if (!previous) {
      return;
    }

    set((state) => ({
      ...previous,
      cursorIndex: cursorForTab(previous.tabs.find((tab) => tab.id === previous.activeTabId)),
      mode: "nav",
      selectedItemIds: [],
      draggingItemIds: [],
      dropTargetTabId: null,
      itemDropTarget: null,
      selectionAnchorId: null,
      undoStack: state.undoStack.slice(0, -1),
    }));
    void saveNotes(previous);
  },
}));
