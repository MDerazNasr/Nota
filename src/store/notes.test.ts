import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultAppState } from "../lib/defaults";
import type { AppState } from "../lib/types";
import { resetStoreLoaderForTests, setStoreLoaderForTests } from "./persist";
import { useNotesStore } from "./notes";
import { useSettingsStore } from "./settings";

class MemoryStore {
  async get<T>(): Promise<T | undefined> {
    return undefined;
  }

  async set(): Promise<void> {}

  async save(): Promise<void> {}
}

describe("notes store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setStoreLoaderForTests((async () => new MemoryStore()) as never);
    resetNotesState(createDefaultAppState());
    useSettingsStore.setState({ itemLimit: 15 });
  });

  afterEach(() => {
    vi.useRealTimers();
    resetStoreLoaderForTests();
    vi.restoreAllMocks();
  });

  it("creates a tab and starts inline title editing", () => {
    useNotesStore.getState().createTab();

    const state = useNotesStore.getState();

    expect(state.tabs).toHaveLength(2);
    expect(state.activeTabId).toBe(state.tabs[1].id);
    expect(state.editingTabId).toBe(state.tabs[1].id);
    expect(state.cursorIndex).toBe(-1);
  });

  it("normalizes tab titles on update", () => {
    const tabId = useNotesStore.getState().activeTabId;

    useNotesStore.getState().updateTabTitle(tabId, "  A very long tab title that should be capped at forty characters  ");

    expect(activeTab().title).toBe("A very long tab title that should be cap");

    useNotesStore.getState().updateTabTitle(tabId, "   ");

    expect(activeTab().title).toBe("Untitled");
  });

  it("creates items around the cursor and respects the item limit", () => {
    useSettingsStore.setState({ itemLimit: 2 });

    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");

    const tab = activeTab();

    expect(tab.items).toHaveLength(2);
    expect(useNotesStore.getState().cursorIndex).toBe(1);
  });

  it("moves checked items to the archive and restores them to the source tab", () => {
    useNotesStore.getState().createItem("below");
    const tabBeforeCheck = activeTab();
    const itemId = tabBeforeCheck.items[0].id;

    useNotesStore.getState().checkItem(tabBeforeCheck.id, itemId);

    const checkedState = useNotesStore.getState();

    expect(activeTab().items).toEqual([]);
    expect(checkedState.archive).toHaveLength(1);
    expect(checkedState.archive[0].sourceTabExists).toBe(true);

    useNotesStore.getState().restoreItem(itemId, "original");

    const restoredState = useNotesStore.getState();

    expect(activeTab().items[0].id).toBe(itemId);
    expect(restoredState.archive).toEqual([]);
    expect(restoredState.cursorIndex).toBe(0);
  });

  it("persists item content updates from the editor", () => {
    useNotesStore.getState().createItem("below");
    const tab = activeTab();
    const itemId = tab.items[0].id;

    useNotesStore.getState().updateItemContent(tab.id, itemId, {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Buy milk" }] }],
    });

    expect(activeTab().items[0].content).toEqual({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Buy milk" }] }],
    });
  });

  it("marks archive entries orphaned when their tab is deleted", () => {
    useNotesStore.getState().createItem("below");
    const tab = activeTab();
    const itemId = tab.items[0].id;

    useNotesStore.getState().checkItem(tab.id, itemId);
    useNotesStore.getState().deleteTab(tab.id);

    const state = useNotesStore.getState();

    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].title).toBe("Untitled");
    expect(state.archive[0].sourceTabExists).toBe(false);
  });

  it("moves selected items to another tab", () => {
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().createTab();

    const state = useNotesStore.getState();
    const sourceTab = state.tabs[0];
    const targetTab = state.tabs[1];

    useNotesStore.getState().setSelectedItemIds(sourceTab.items.map((item) => item.id));
    useNotesStore.getState().moveSelectedItemsToTab(targetTab.id);

    const next = useNotesStore.getState();

    expect(next.tabs[0].items).toEqual([]);
    expect(next.tabs[1].items.map((item) => item.id)).toEqual(sourceTab.items.map((item) => item.id));
    expect(next.activeTabId).toBe(targetTab.id);
    expect(next.selectedItemIds).toEqual([]);
  });

  it("moves explicit item ids without relying on selected state", () => {
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createTab();

    const state = useNotesStore.getState();
    const sourceItem = state.tabs[0].items[0];
    const targetTab = state.tabs[1];

    useNotesStore.getState().moveItemsToTab([sourceItem.id], targetTab.id);

    expect(useNotesStore.getState().tabs[0].items).toEqual([]);
    expect(useNotesStore.getState().tabs[1].items[0].id).toBe(sourceItem.id);
  });

  it("finishes a pointer drag by moving dragged item ids to the target tab", () => {
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createTab();

    const state = useNotesStore.getState();
    const sourceItem = state.tabs[0].items[0];
    const targetTab = state.tabs[1];

    useNotesStore.getState().startItemDrag([sourceItem.id]);
    useNotesStore.getState().setDropTargetTabId(targetTab.id);
    useNotesStore.getState().finishItemDrag(targetTab.id);

    const next = useNotesStore.getState();

    expect(next.tabs[0].items).toEqual([]);
    expect(next.tabs[1].items[0].id).toBe(sourceItem.id);
    expect(next.draggingItemIds).toEqual([]);
    expect(next.dropTargetTabId).toBeNull();
  });

  it("cancels a pointer drag without moving items", () => {
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createTab();

    const state = useNotesStore.getState();
    const sourceItem = state.tabs[0].items[0];

    useNotesStore.getState().startItemDrag([sourceItem.id]);
    useNotesStore.getState().finishItemDrag(null);

    const next = useNotesStore.getState();

    expect(next.tabs[0].items[0].id).toBe(sourceItem.id);
    expect(next.tabs[1].items).toEqual([]);
    expect(next.draggingItemIds).toEqual([]);
    expect(next.dropTargetTabId).toBeNull();
  });

  it("restores orphaned archived items to the current tab", () => {
    useNotesStore.getState().createItem("below");
    const sourceTab = activeTab();
    const itemId = sourceTab.items[0].id;

    useNotesStore.getState().checkItem(sourceTab.id, itemId);
    useNotesStore.getState().deleteTab(sourceTab.id);
    const currentTabId = useNotesStore.getState().activeTabId;

    useNotesStore.getState().restoreItem(itemId, "current");

    const state = useNotesStore.getState();

    expect(state.activeTabId).toBe(currentTabId);
    expect(activeTab().items[0].id).toBe(itemId);
    expect(state.archive).toEqual([]);
  });

  it("restores orphaned archived items to a new tab name", () => {
    useNotesStore.getState().createItem("below");
    const sourceTab = activeTab();
    const itemId = sourceTab.items[0].id;

    useNotesStore.getState().checkItem(sourceTab.id, itemId);
    useNotesStore.getState().deleteTab(sourceTab.id);
    useNotesStore.getState().restoreItem(itemId, "Recovered");

    const state = useNotesStore.getState();
    const restoredTab = state.tabs.find((tab) => tab.title === "Recovered");

    expect(restoredTab?.items[0].id).toBe(itemId);
    expect(state.activeTabId).toBe(restoredTab?.id);
    expect(state.archive).toEqual([]);
  });

  it("deletes archived items and clears the archive", () => {
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");
    const tab = activeTab();
    const ids = tab.items.map((item) => item.id);

    useNotesStore.getState().checkItem(tab.id, ids[0]);
    useNotesStore.getState().checkItem(tab.id, ids[1]);

    useNotesStore.getState().deleteArchivedItem(ids[0]);

    expect(useNotesStore.getState().archive.map((item) => item.id)).toEqual([ids[1]]);

    useNotesStore.getState().clearArchive();

    expect(useNotesStore.getState().archive).toEqual([]);
  });
});

function resetNotesState(state: AppState) {
  useNotesStore.setState({
    ...state,
    cursorIndex: -1,
    mode: "nav",
    archiveOpen: false,
    editingTabId: null,
    selectedItemIds: [],
    draggingItemIds: [],
    dropTargetTabId: null,
    hydrated: true,
  });
}

function activeTab() {
  const state = useNotesStore.getState();
  const tab = state.tabs.find((entry) => entry.id === state.activeTabId);

  if (!tab) {
    throw new Error("Expected an active tab");
  }

  return tab;
}
