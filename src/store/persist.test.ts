import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppState, Settings } from "../lib/types";
import { loadNotes, loadSettings, resetStoreLoaderForTests, setStoreLoaderForTests } from "./persist";

type StoreData = Record<string, unknown>;

class MemoryStore {
  constructor(private data: StoreData) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.data[key] as T | undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    this.data[key] = value;
  }

  async save(): Promise<void> {}
}

describe("persist", () => {
  afterEach(() => {
    resetStoreLoaderForTests();
    vi.restoreAllMocks();
  });

  it("loads default notes when the notes store is missing", async () => {
    const stores: Record<string, StoreData> = {};

    setStoreLoaderForTests((async (path: string, options?: { defaults: StoreData }) => {
      stores[path] = stores[path] ?? { ...options?.defaults };
      return new MemoryStore(stores[path]);
    }) as never);

    const notes = await loadNotes();

    expect(notes.tabs).toHaveLength(1);
    expect(notes.tabs[0].title).toBe("Untitled");
    expect(notes.activeTabId).toBe(notes.tabs[0].id);
    expect(notes.archive).toEqual([]);
  });

  it("recomputes archived item sourceTabExists on load", async () => {
    const stored: AppState = {
      tabs: [{ id: "tab-1", title: "Work", items: [], createdAt: 1 }],
      activeTabId: "tab-1",
      archive: [
        {
          id: "archived-1",
          content: { type: "doc" },
          archivedAt: 2,
          sourceTabId: "tab-1",
          sourceTabTitle: "Work",
          sourceTabExists: false,
        },
        {
          id: "archived-2",
          content: { type: "doc" },
          archivedAt: 3,
          sourceTabId: "missing",
          sourceTabTitle: "Old",
          sourceTabExists: true,
        },
      ],
    };

    setStoreLoaderForTests((async () => new MemoryStore({ state: stored })) as never);

    const notes = await loadNotes();

    expect(notes.archive[0].sourceTabExists).toBe(true);
    expect(notes.archive[1].sourceTabExists).toBe(false);
  });

  it("falls back to default settings when stored settings are corrupt", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const data = { settings: { theme: "dark-zinc" } };

    setStoreLoaderForTests((async () => new MemoryStore(data)) as never);

    const settings = await loadSettings();

    expect(settings.theme).toBe("dark-zinc");
    expect(settings.font).toBe("JetBrains Mono");
    expect(settings.shortcuts.toggleWindow).toBe("CommandOrControl+Shift+N");
    expect((data.settings as Settings).fontSize).toBe(13);
    expect(consoleError).toHaveBeenCalled();
  });

  it("merges window position from the settings store root", async () => {
    setStoreLoaderForTests(
      (async () =>
        new MemoryStore({
          settings: {
            theme: "light",
            font: "JetBrains Mono",
            fontSize: 13,
            borderRadius: 4,
            itemLimit: 15,
            openOnStartup: false,
            showInDock: true,
            shortcuts: {
              toggleWindow: "CommandOrControl+Shift+N",
              toggleArchive: "CommandOrControl+0",
              newTab: "CommandOrControl+T",
              openSettings: "CommandOrControl+,",
              checkItem: "CommandOrControl+Enter",
            },
          },
          windowPosition: { x: 80, y: 120 },
        })) as never,
    );

    const settings = await loadSettings();

    expect(settings.windowPosition).toEqual({ x: 80, y: 120 });
  });
});
