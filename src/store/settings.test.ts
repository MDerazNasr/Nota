import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultSettings } from "../lib/defaults";
import { resetStoreLoaderForTests, setStoreLoaderForTests } from "./persist";
import { useSettingsStore } from "./settings";

class MemoryStore {
  async get<T>(): Promise<T | undefined> {
    return undefined;
  }

  async set(): Promise<void> {}

  async save(): Promise<void> {}
}

describe("settings store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setStoreLoaderForTests((async () => new MemoryStore()) as never);
    useSettingsStore.setState({ ...createDefaultSettings(), hydrated: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    resetStoreLoaderForTests();
  });

  it("clamps ranged appearance settings", () => {
    useSettingsStore.getState().setFontSize(99);
    useSettingsStore.getState().setBorderRadius(-5);
    useSettingsStore.getState().setItemLimit(2);

    expect(useSettingsStore.getState().fontSize).toBe(20);
    expect(useSettingsStore.getState().borderRadius).toBe(0);
    expect(useSettingsStore.getState().itemLimit).toBe(5);
  });

  it("resets one setting without resetting unrelated values", () => {
    useSettingsStore.getState().setTheme("dracula");
    useSettingsStore.getState().setFontSize(18);

    useSettingsStore.getState().resetSetting("theme");

    expect(useSettingsStore.getState().theme).toBe("dark-zinc");
    expect(useSettingsStore.getState().fontSize).toBe(18);
  });

  it("updates archive completion behavior", () => {
    useSettingsStore.getState().setArchiveCompletedItems(false);

    expect(useSettingsStore.getState().archiveCompletedItems).toBe(false);
  });
});
