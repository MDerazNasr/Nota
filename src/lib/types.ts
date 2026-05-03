import type { JSONContent } from "@tiptap/core";
import type { FontOption } from "./fonts";

export type { FontOption } from "./fonts";

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

export type AppState = {
  tabs: Tab[];
  activeTabId: string;
};

export type ShortcutMap = {
  toggleWindow: string;
  newTab: string;
  openSettings: string;
  checkItem: string;
  renameTab: string;
  moveTabLeft: string;
  moveTabRight: string;
  createItemBelow: string;
  createItemAbove: string;
  editItem: string;
  deleteItem: string;
  enterMoveMode: string;
  undo: string;
  openItemLink: string;
  sortByTag: string;
};

export type WindowPosition = {
  x: number;
  y: number;
};

export type WindowSize = {
  height: number;
  width: number;
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
  windowSize?: WindowSize;
};

export type AppMode = "nav" | "edit" | "move";
