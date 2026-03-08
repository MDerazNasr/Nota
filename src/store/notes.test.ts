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
});

function resetNotesState(state: AppState) {
  useNotesStore.setState({
    ...state,
    cursorIndex: -1,
    mode: "nav",
    archiveOpen: false,
    editingTabId: null,
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
