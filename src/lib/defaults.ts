import { nanoid } from "nanoid";
import type { AppState, Settings, Tab } from "./types";

export const EMPTY_DOC = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

export const DEFAULT_SHORTCUTS = {
  toggleWindow: "Alt+Shift+KeyN",
  newTab: "CommandOrControl+T",
  openSettings: "CommandOrControl+,",
  checkItem: "CommandOrControl+Enter",
  renameTab: "CommandOrControl+Shift+R",
  moveTabLeft: "Shift+<",
  moveTabRight: "Shift+>",
  createItemBelow: "O",
  createItemAbove: "Shift+O",
  editItem: "Enter",
  deleteItem: "Delete",
  enterMoveMode: "Space",
  undo: "U",
  openItemLink: "CommandOrControl+X",
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark-zinc",
  font: "JetBrains Mono",
  fontSize: 13,
  borderRadius: 8,
  itemLimit: 15,
  openOnStartup: false,
  showInDock: true,
  showInMenuBar: false,
  shortcuts: DEFAULT_SHORTCUTS,
};

export function createDefaultTab(title = "Untitled"): Tab {
  return {
    id: nanoid(10),
    title,
    items: [],
    createdAt: Date.now(),
  };
}

export function createDefaultAppState(): AppState {
  const tab = createDefaultTab();

  return {
    tabs: [tab],
    activeTabId: tab.id,
  };
}

export function createDefaultSettings(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    shortcuts: { ...DEFAULT_SHORTCUTS },
  };
}
