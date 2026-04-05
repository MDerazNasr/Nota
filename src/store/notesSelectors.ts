import type { AppState, Tab } from "../lib/types";

export function activeTab(state: Pick<AppState, "tabs" | "activeTabId">): Tab | undefined {
  return state.tabs.find((tab) => tab.id === state.activeTabId);
}

export function cursorForTab(tab: Tab | undefined): number {
  return tab && tab.items.length > 0 ? 0 : -1;
}

export function clampCursor(index: number, tab: Tab | undefined) {
  if (!tab || tab.items.length === 0) {
    return -1;
  }

  return Math.min(Math.max(index, 0), tab.items.length - 1);
}

export function normalizeTitle(title: string) {
  const trimmed = title.trim().slice(0, 40);
  return trimmed.length > 0 ? trimmed : "Untitled";
}
