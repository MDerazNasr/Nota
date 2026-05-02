import type { JSONContent } from "@tiptap/core";

export type ItemState = "active" | "done";

export type ItemTag = {
  name: string;
  color: string;
};

export type Item = {
  id: string;
  content: JSONContent;
  state: ItemState;
  tags: ItemTag[];
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
  tags?: ItemTag[];
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

export type FontOption =
  | "JetBrains Mono"
  | "Fira Code"
  | "IBM Plex Mono"
  | "Geist Mono"
  | "SF Mono"
  | "Menlo"
  | "Monaco"
  | "Cascadia Code"
  | "Source Code Pro"
  | "Recursive Mono";

export type ShortcutMap = {
  toggleWindow: string;
  toggleArchive: string;
  newTab: string;
  openSettings: string;
  checkItem: string;
  renameTab: string;
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
  showInMenuBar: boolean;
  shortcuts: ShortcutMap;
  windowPosition?: WindowPosition;
};

export type AppMode = "nav" | "edit" | "move";
