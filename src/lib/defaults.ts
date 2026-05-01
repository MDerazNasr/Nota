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
  toggleWindow: "CommandOrControl+Shift+N",
  toggleArchive: "CommandOrControl+0",
  newTab: "CommandOrControl+T",
  openSettings: "CommandOrControl+,",
  checkItem: "CommandOrControl+Enter",
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "dark-zinc",
  font: "JetBrains Mono",
  fontSize: 13,
  borderRadius: 4,
  itemLimit: 15,
  openOnStartup: false,
  showInDock: true,
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
    archive: [],
  };
}

export function createDefaultSettings(): Settings {
  return {
    ...DEFAULT_SETTINGS,
    shortcuts: { ...DEFAULT_SHORTCUTS },
  };
}
