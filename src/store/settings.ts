import { create } from "zustand";
import { createDefaultSettings, DEFAULT_SETTINGS } from "../lib/defaults";
import { applyTheme } from "../lib/themes";
import type { FontOption, Settings, ShortcutMap } from "../lib/types";
import { loadSettings, saveSettings } from "./persist";

type SettingsKey = keyof Settings;

type SettingsStore = Settings & {
  hydrated: boolean;
  hydrateSettings: () => Promise<void>;
  setTheme: (theme: string) => void;
  setFont: (font: FontOption) => void;
  setFontSize: (fontSize: number) => void;
  setBorderRadius: (borderRadius: number) => void;
  setItemLimit: (itemLimit: number) => void;
  setOpenOnStartup: (openOnStartup: boolean) => void;
  setShowInDock: (showInDock: boolean) => void;
  setShowInMenuBar: (showInMenuBar: boolean) => void;
  updateShortcut: (key: keyof ShortcutMap, value: string) => void;
  resetSetting: (key: SettingsKey) => void;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...createDefaultSettings(),
  hydrated: false,
  hydrateSettings: async () => {
    const settings = await loadSettings();
    set({ ...settings, hydrated: true });
    applySettingsToDom(settings);
  },
  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
    queueSave(get());
  },
  setFont: (font) => {
    set({ font });
    setCssVariable("--font-family", `"${font}", monospace`);
    queueSave(get());
  },
  setFontSize: (fontSize) => {
    const clamped = clamp(fontSize, 10, 20);
    set({ fontSize: clamped });
    setCssVariable("--font-size", `${clamped}px`);
    queueSave(get());
  },
  setBorderRadius: (borderRadius) => {
    const clamped = clamp(borderRadius, 0, 12);
    set({ borderRadius: clamped });
    setCssVariable("--radius", `${clamped}px`);
    queueSave(get());
  },
  setItemLimit: (itemLimit) => {
    set({ itemLimit: clamp(itemLimit, 5, 50) });
    queueSave(get());
  },
  setOpenOnStartup: (openOnStartup) => {
    set({ openOnStartup });
    queueSave(get());
  },
  setShowInDock: (showInDock) => {
    set({ showInDock });
    queueSave(get());
  },
  setShowInMenuBar: (showInMenuBar) => {
    set({ showInMenuBar });
    queueSave(get());
  },
  updateShortcut: (key, value) => {
    set((state) => ({
      shortcuts: {
        ...state.shortcuts,
        [key]: value,
      },
    }));
    queueSave(get());
  },
  resetSetting: (key) => {
    const defaults = createDefaultSettings();

    if (key === "shortcuts") {
      set({ shortcuts: defaults.shortcuts });
    } else {
      set({ [key]: defaults[key] });
    }

    applySettingsToDom(get());
    queueSave(get());
  },
}));

function queueSave(settings: Settings) {
  void saveSettings(toSettings(settings));
}

function toSettings(state: Settings): Settings {
  return {
    theme: state.theme,
    font: state.font,
    fontSize: state.fontSize,
    borderRadius: state.borderRadius,
    itemLimit: state.itemLimit,
    openOnStartup: state.openOnStartup,
    showInDock: state.showInDock,
    showInMenuBar: state.showInMenuBar,
    shortcuts: state.shortcuts,
    windowPosition: state.windowPosition,
    windowSize: state.windowSize,
  };
}

function applySettingsToDom(settings: Settings) {
  applyTheme(settings.theme);
  setCssVariable("--font-family", `"${settings.font}", monospace`);
  setCssVariable("--font-size", `${settings.fontSize}px`);
  setCssVariable("--radius", `${settings.borderRadius}px`);
}

function setCssVariable(key: string, value: string) {
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty(key, value);
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export const settingsDefaults = DEFAULT_SETTINGS;
