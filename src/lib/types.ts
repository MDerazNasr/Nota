import type { JSONContent } from "@tiptap/core";

export type ItemState = "active" | "done";

export type Item = {
  id: string;
  content: JSONContent;
  state: ItemState;
  createdAt: number;
};

export type Tab = {
  id: string;
  title: string;
  items: Item[];
  createdAt: number;
};

export type ArchivedItem = {
  id: string;
  content: JSONContent;
  archivedAt: number;
  sourceTabId: string;
  sourceTabTitle: string;
  sourceTabExists: boolean;
};

export type AppState = {
  tabs: Tab[];
  activeTabId: string;
  archive: ArchivedItem[];
};

export type FontOption = "JetBrains Mono" | "Fira Code" | "IBM Plex Mono" | "Geist Mono";

export type ShortcutMap = {
  toggleWindow: string;
  toggleArchive: string;
  newTab: string;
  openSettings: string;
  checkItem: string;
};

export type WindowPosition = {
  x: number;
  y: number;
};

export type Settings = {
  theme: string;
  font: FontOption;
  fontSize: number;
  borderRadius: number;
  itemLimit: number;
  openOnStartup: boolean;
  showInDock: boolean;
  shortcuts: ShortcutMap;
  windowPosition?: WindowPosition;
};

export type AppMode = "nav" | "edit";
