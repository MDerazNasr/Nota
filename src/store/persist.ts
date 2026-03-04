import { load } from "@tauri-apps/plugin-store";
import { createDefaultAppState, createDefaultSettings } from "../lib/defaults";
import type { AppState, ArchivedItem, Settings, Tab } from "../lib/types";

type StoreLike = {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  save(): Promise<void>;
};

type StoreLoader = typeof load;

const NOTES_FILE = "notes.json";
const SETTINGS_FILE = "settings.json";
const NOTES_KEY = "state";
const SETTINGS_KEY = "settings";
const SAVE_DELAY_MS = 300;

let storeLoader: StoreLoader = load;
let notesSaveTimer: ReturnType<typeof setTimeout> | undefined;
let settingsSaveTimer: ReturnType<typeof setTimeout> | undefined;

export function setStoreLoaderForTests(loader: StoreLoader) {
  storeLoader = loader;
}

export function resetStoreLoaderForTests() {
  storeLoader = load;
  clearTimeout(notesSaveTimer);
  clearTimeout(settingsSaveTimer);
}

export async function loadNotes(): Promise<AppState> {
  const fallback = createDefaultAppState();

  try {
    const store = await openStore(NOTES_FILE, { [NOTES_KEY]: fallback });
    const stored = await store.get<AppState>(NOTES_KEY);
    const normalized = normalizeAppState(stored);

    if (!normalized) {
      throw new Error("Invalid notes store");
    }

    return normalized;
  } catch (error) {
    console.error("Failed to load notes store", error);
    await saveNotesNow(fallback).catch((saveError) => {
      console.error("Failed to reset notes store", saveError);
    });
    return fallback;
  }
}

export function saveNotes(state: AppState): Promise<void> {
  return debounceSave("notes", () => saveNotesNow(stripArchiveRuntimeFields(state)));
}

export async function loadSettings(): Promise<Settings> {
  const fallback = createDefaultSettings();

  try {
    const store = await openStore(SETTINGS_FILE, { [SETTINGS_KEY]: fallback });
    const stored = await store.get<Settings>(SETTINGS_KEY);
    const normalized = normalizeSettings(stored);

    if (!normalized) {
      throw new Error("Invalid settings store");
    }

    return normalized;
  } catch (error) {
    console.error("Failed to load settings store", error);
    await saveSettingsNow(fallback).catch((saveError) => {
      console.error("Failed to reset settings store", saveError);
    });
    return fallback;
  }
}

export function saveSettings(settings: Settings): Promise<void> {
  return debounceSave("settings", () => saveSettingsNow(settings));
}

async function openStore(path: string, defaults: Record<string, unknown>): Promise<StoreLike> {
  return storeLoader(path, {
    defaults,
    autoSave: false,
  });
}

async function saveNotesNow(state: AppState): Promise<void> {
  const store = await openStore(NOTES_FILE, { [NOTES_KEY]: state });
  await store.set(NOTES_KEY, state);
  await store.save();
}

async function saveSettingsNow(settings: Settings): Promise<void> {
  const store = await openStore(SETTINGS_FILE, { [SETTINGS_KEY]: settings });
  await store.set(SETTINGS_KEY, settings);
  await store.save();
}

function debounceSave(kind: "notes" | "settings", task: () => Promise<void>): Promise<void> {
  const setTimer = kind === "notes" ? setNotesTimer : setSettingsTimer;
  const currentTimer = kind === "notes" ? notesSaveTimer : settingsSaveTimer;

  clearTimeout(currentTimer);

  return new Promise((resolve, reject) => {
    setTimer(
      setTimeout(() => {
        task().then(resolve).catch(reject);
      }, SAVE_DELAY_MS),
    );
  });
}

function setNotesTimer(timer: ReturnType<typeof setTimeout>) {
  notesSaveTimer = timer;
}

function setSettingsTimer(timer: ReturnType<typeof setTimeout>) {
  settingsSaveTimer = timer;
}

function normalizeAppState(value: unknown): AppState | null {
  if (!isAppState(value)) {
    return null;
  }

  const tabs = value.tabs.length > 0 ? value.tabs : createDefaultAppState().tabs;
  const tabIds = new Set(tabs.map((tab) => tab.id));
  const activeTabId = tabIds.has(value.activeTabId) ? value.activeTabId : tabs[0].id;
  const archive = value.archive.map((item) => ({
    ...item,
    sourceTabExists: tabIds.has(item.sourceTabId),
  }));

  return { tabs, activeTabId, archive };
}

function normalizeSettings(value: unknown): Settings | null {
  if (!isSettings(value)) {
    return null;
  }

  return {
    ...createDefaultSettings(),
    ...value,
    shortcuts: {
      ...createDefaultSettings().shortcuts,
      ...value.shortcuts,
    },
  };
}

function stripArchiveRuntimeFields(state: AppState): AppState {
  return {
    ...state,
    archive: state.archive.map(({ sourceTabExists: _sourceTabExists, ...item }) => item as ArchivedItem),
  };
}

function isAppState(value: unknown): value is AppState {
  if (!isRecord(value) || !Array.isArray(value.tabs) || !Array.isArray(value.archive)) {
    return false;
  }

  return typeof value.activeTabId === "string" && value.tabs.every(isTab) && value.archive.every(isArchivedItem);
}

function isTab(value: unknown): value is Tab {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    Array.isArray(value.items) &&
    typeof value.createdAt === "number"
  );
}

function isArchivedItem(value: unknown): value is ArchivedItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.archivedAt === "number" &&
    typeof value.sourceTabId === "string" &&
    typeof value.sourceTabTitle === "string"
  );
}

function isSettings(value: unknown): value is Settings {
  return (
    isRecord(value) &&
    typeof value.theme === "string" &&
    typeof value.font === "string" &&
    typeof value.fontSize === "number" &&
    typeof value.borderRadius === "number" &&
    typeof value.itemLimit === "number" &&
    typeof value.openOnStartup === "boolean" &&
    typeof value.showInDock === "boolean" &&
    isRecord(value.shortcuts)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
