export type SettingsTab = "appearance" | "shortcuts" | "about";

export const SETTINGS_TABS: SettingsTab[] = ["appearance", "shortcuts", "about"];

export function moveSettingsTab(current: SettingsTab, offset: -1 | 1) {
  const currentIndex = SETTINGS_TABS.indexOf(current);

  if (currentIndex === -1) {
    return SETTINGS_TABS[0];
  }

  const nextIndex = (currentIndex + offset + SETTINGS_TABS.length) % SETTINGS_TABS.length;
  return SETTINGS_TABS[nextIndex];
}

export function moveSettingsFocus(currentIndex: number, offset: -1 | 1, itemCount: number) {
  if (itemCount <= 0) {
    return 0;
  }

  return (currentIndex + offset + itemCount) % itemCount;
}
