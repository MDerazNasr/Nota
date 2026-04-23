import { invoke } from "@tauri-apps/api/core";
import { disable, enable } from "@tauri-apps/plugin-autostart";
import { useEffect, useRef, useState } from "react";
import { displayShortcut, formatShortcut } from "../../lib/shortcuts";
import type { ShortcutMap } from "../../lib/types";
import { useSettingsStore } from "../../store/settings";

const HOTKEY_SECTIONS: Array<{
  label: string;
  shortcuts: Array<{ key: keyof ShortcutMap; label: string }>;
}> = [
  {
    label: "Window",
    shortcuts: [
      { key: "toggleWindow", label: "Toggle window" },
      { key: "openSettings", label: "Open settings" },
      { key: "toggleArchive", label: "Toggle archive" },
    ],
  },
  {
    label: "Tabs",
    shortcuts: [
      { key: "newTab", label: "New tab" },
      { key: "renameTab", label: "Rename tab" },
      { key: "moveTabLeft", label: "Move tab left" },
      { key: "moveTabRight", label: "Move tab right" },
    ],
  },
  {
    label: "Item editing",
    shortcuts: [
      { key: "createItemBelow", label: "New item below" },
      { key: "createItemAbove", label: "New item above" },
      { key: "editItem", label: "Edit focused item" },
      { key: "deleteItem", label: "Delete focused item" },
      { key: "checkItem", label: "Check item" },
      { key: "openItemLink", label: "Open item link" },
      { key: "undo", label: "Undo" },
    ],
  },
  {
    label: "Item movement",
    shortcuts: [{ key: "enterMoveMode", label: "Enter move mode" }],
  },
];

export function ShortcutsTab() {
  const openOnStartup = useSettingsStore((state) => state.openOnStartup);
  const showInDock = useSettingsStore((state) => state.showInDock);
  const showInMenuBar = useSettingsStore((state) => state.showInMenuBar);
  const archiveCompletedItems = useSettingsStore((state) => state.archiveCompletedItems);
  const shortcuts = useSettingsStore((state) => state.shortcuts);
  const setOpenOnStartup = useSettingsStore((state) => state.setOpenOnStartup);
  const setShowInDock = useSettingsStore((state) => state.setShowInDock);
  const setShowInMenuBar = useSettingsStore((state) => state.setShowInMenuBar);
  const setArchiveCompletedItems = useSettingsStore((state) => state.setArchiveCompletedItems);
  const updateShortcut = useSettingsStore((state) => state.updateShortcut);
  const [captureKey, setCaptureKey] = useState<keyof ShortcutMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleStartup = async (checked: boolean) => {
    setOpenOnStartup(checked);
    try {
      if (checked) {
        await enable();
      } else {
        await disable();
      }
      setError(null);
    } catch {
      setError("Could not update startup behavior.");
    }
  };

  const toggleDock = async (checked: boolean) => {
    setShowInDock(checked);
    try {
      await invoke("set_activation_policy", { show: checked });
      setError(null);
    } catch {
      setError("Could not update dock visibility.");
    }
  };

  const toggleMenuBar = async (checked: boolean) => {
    setShowInMenuBar(checked);
    try {
      await invoke("set_menu_bar_icon", { show: checked });
      setError(null);
    } catch {
      setError("Could not update menu bar visibility.");
    }
  };

  const saveShortcut = async (key: keyof ShortcutMap, value: string) => {
    const oldValue = shortcuts[key];
    updateShortcut(key, value);
    setCaptureKey(null);

    if (key !== "toggleWindow") {
      return;
    }

    try {
      await invoke("update_global_shortcut", { old: oldValue, new: value });
      setError(null);
    } catch {
      setError("Could not register global shortcut. Check for conflicts in System Preferences.");
    }
  };

  return (
    <section className="settings-section" aria-label="Navigation settings">
      <div className="setting-group-label">Behavior</div>
      <ToggleRow checked={openOnStartup} label="Open on startup" onChange={toggleStartup} />
      <ToggleRow checked={showInDock} label="Show in dock" onChange={toggleDock} />
      <ToggleRow checked={showInMenuBar} label="Show in menu bar" onChange={toggleMenuBar} />
      <ToggleRow checked={archiveCompletedItems} label="Active archive" onChange={setArchiveCompletedItems} />
      <div className="setting-group-label">Navigation</div>
      {HOTKEY_SECTIONS.map((section) => (
        <div className="hotkey-section" key={section.label}>
          <div className="hotkey-section-label">{section.label}</div>
          {section.shortcuts.map(({ key, label }) => (
            <HotkeyRow
              capturing={captureKey === key}
              key={key}
              label={label}
              value={shortcuts[key]}
              onCapture={() => setCaptureKey(key)}
              onCancel={() => setCaptureKey(null)}
              onSave={(value) => void saveShortcut(key, value)}
            />
          ))}
        </div>
      ))}
      {error ? <p className="settings-error">{error}</p> : null}
    </section>
  );
}

type ToggleRowProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => Promise<void> | void;
};

function ToggleRow({ checked, label, onChange }: ToggleRowProps) {
  return (
    <label className="toggle-row" data-settings-row="toggle" tabIndex={-1}>
      <span>{label}</span>
      <input
        data-settings-primary
        type="checkbox"
        checked={checked}
        onChange={(event) => void onChange(event.currentTarget.checked)}
      />
    </label>
  );
}

type HotkeyRowProps = {
  capturing: boolean;
  label: string;
  value: string;
  onCapture: () => void;
  onCancel: () => void;
  onSave: (value: string) => void;
};

function HotkeyRow({ capturing, label, onCancel, onCapture, onSave, value }: HotkeyRowProps) {
  const captureRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (capturing) {
      captureRef.current?.focus();
    }
  }, [capturing]);

  return (
    <div className="hotkey-row" data-settings-row="hotkey" tabIndex={-1}>
      <span>{label}</span>
      <button
        ref={captureRef}
        className={capturing ? "hotkey-capture active" : "hotkey-capture"}
        data-hotkey-capturing={capturing ? "true" : undefined}
        data-settings-primary
        type="button"
        title={value || "Disabled"}
        onClick={onCapture}
        onKeyDown={(event) => {
          if (!capturing) {
            return;
          }

          event.stopPropagation();
          event.preventDefault();

          if (event.key === "Escape") {
            onCancel();
          } else if (event.key === "Backspace") {
            onSave("");
          } else {
            const next = formatShortcut(event);
            if (next) {
              onSave(next);
            }
          }
        }}
      >
        {capturing ? "Press keys" : displayShortcut(value)}
      </button>
    </div>
  );
}
