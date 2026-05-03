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

  it("crosses completed items out and moves them to the bottom", () => {
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");

    const tab = activeTab();
    const ids = tab.items.map((item) => item.id);

    useNotesStore.getState().checkItem(tab.id, ids[0]);

    const next = activeTab();

    expect(next.items.map((item) => item.id)).toEqual([ids[1], ids[0]]);
    expect(next.items[1].state).toBe("done");
    expect(useNotesStore.getState().cursorIndex).toBe(1);
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

  it("adds multiple tags to items and reuses the existing tag color", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");

    const tab = activeTab();
    const [firstId, secondId] = tab.items.map((item) => item.id);

    useNotesStore.getState().addItemTag(tab.id, firstId, " work ");
    useNotesStore.getState().addItemTag(tab.id, firstId, "urgent");
    useNotesStore.getState().addItemTag(tab.id, secondId, "Work");

    const [first, second] = activeTab().items;

    expect(first.tags.map((tag) => tag.name)).toEqual(["work", "urgent"]);
    expect(second.tags).toEqual([{ name: "work", color: first.tags[0].color }]);

    useNotesStore.getState().removeItemTag(tab.id, firstId, "work");
    useNotesStore.getState().removeItemTag(tab.id, secondId, "work");

    expect(activeTab().items.map((item) => item.tags.map((tag) => tag.name))).toEqual([["urgent"], []]);
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

  it("reorders dragged items inside the current tab", () => {
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");

    const tab = activeTab();
    const ids = tab.items.map((item) => item.id);

    useNotesStore.getState().startItemDrag([ids[2]]);
    useNotesStore.getState().finishItemDragAtItem({ itemId: ids[0], position: "before", tabId: tab.id });

    const next = activeTab();

    expect(next.items.map((item) => item.id)).toEqual([ids[2], ids[0], ids[1]]);
    expect(useNotesStore.getState().cursorIndex).toBe(0);
  });

  it("reorders a keyboard move selection and can undo it", () => {
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");

    const ids = activeTab().items.map((item) => item.id);

    useNotesStore.getState().setCursorIndex(0);
    useNotesStore.getState().enterMoveMode();
    useNotesStore.getState().reorderMoveSelection("down");

    expect(activeTab().items.map((item) => item.id)).toEqual([ids[1], ids[0], ids[2]]);
    expect(useNotesStore.getState().mode).toBe("move");

    useNotesStore.getState().undoLastChange();

    expect(activeTab().items.map((item) => item.id)).toEqual(ids);
    expect(useNotesStore.getState().mode).toBe("nav");
  });

  it("extends move selection by one item or by range", () => {
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");

    const ids = activeTab().items.map((item) => item.id);

    useNotesStore.getState().setCursorIndex(0);
    useNotesStore.getState().enterMoveMode();
    useNotesStore.getState().extendMoveSelection("down", false);

    expect(useNotesStore.getState().selectedItemIds).toEqual([ids[0], ids[1]]);

    useNotesStore.getState().extendMoveSelection("down", true);

    expect(useNotesStore.getState().selectedItemIds).toEqual([ids[0], ids[1], ids[2]]);
  });

  it("deletes selected items from move mode", () => {
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");
    useNotesStore.getState().setMode("nav");
    useNotesStore.getState().createItem("below");

    const tab = activeTab();
    const ids = tab.items.map((item) => item.id);

    useNotesStore.getState().setSelectedItemIds([ids[0], ids[2]]);
    useNotesStore.getState().setMode("move");
    useNotesStore.getState().deleteSelectedItems();

    expect(activeTab().items.map((item) => item.id)).toEqual([ids[1]]);
    expect(useNotesStore.getState().mode).toBe("nav");
    expect(useNotesStore.getState().selectedItemIds).toEqual([]);
  });
});

function resetNotesState(state: AppState) {
  useNotesStore.setState({
    ...state,
    cursorIndex: -1,
    mode: "nav",
    editingTabId: null,
    selectedItemIds: [],
    draggingItemIds: [],
    dropTargetTabId: null,
    itemDropTarget: null,
    selectionAnchorId: null,
    undoStack: [],
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
