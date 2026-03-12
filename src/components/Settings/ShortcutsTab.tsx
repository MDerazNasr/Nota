import { invoke } from "@tauri-apps/api/core";
import { disable, enable } from "@tauri-apps/plugin-autostart";
import { useEffect, useRef, useState } from "react";
import { formatShortcut } from "../../lib/shortcuts";
import type { ShortcutMap } from "../../lib/types";
import { useSettingsStore } from "../../store/settings";

const HOTKEY_LABELS: Record<keyof ShortcutMap, string> = {
  toggleWindow: "Toggle Window",
  toggleArchive: "Toggle Archive",
  newTab: "New Tab",
  openSettings: "Open Settings",
  checkItem: "Check Item",
};

export function ShortcutsTab() {
  const openOnStartup = useSettingsStore((state) => state.openOnStartup);
  const showInDock = useSettingsStore((state) => state.showInDock);
  const shortcuts = useSettingsStore((state) => state.shortcuts);
  const setOpenOnStartup = useSettingsStore((state) => state.setOpenOnStartup);
  const setShowInDock = useSettingsStore((state) => state.setShowInDock);
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
    <section className="settings-section" aria-label="Shortcut settings">
      <div className="setting-group-label">Behavior</div>
      <ToggleRow checked={openOnStartup} label="Open on startup" onChange={toggleStartup} />
      <ToggleRow checked={showInDock} label="Show in dock" onChange={toggleDock} />
      <div className="setting-group-label">Hotkeys</div>
      {(Object.keys(HOTKEY_LABELS) as Array<keyof ShortcutMap>).map((key) => (
        <HotkeyRow
          capturing={captureKey === key}
          key={key}
          label={HOTKEY_LABELS[key]}
          value={shortcuts[key]}
          onCapture={() => setCaptureKey(key)}
          onCancel={() => setCaptureKey(null)}
          onSave={(value) => void saveShortcut(key, value)}
        />
      ))}
      {error ? <p className="settings-error">{error}</p> : null}
    </section>
  );
}

type ToggleRowProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => Promise<void>;
};

function ToggleRow({ checked, label, onChange }: ToggleRowProps) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => void onChange(event.currentTarget.checked)} />
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
    <div className="hotkey-row">
      <span>{label}</span>
      <button
        ref={captureRef}
        className={capturing ? "hotkey-capture active" : "hotkey-capture"}
        type="button"
        onClick={onCapture}
        onKeyDown={(event) => {
          if (!capturing) {
            return;
          }

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
        {capturing ? "Press keys" : value || "Disabled"}
      </button>
      <button type="button" onClick={onCapture}>
        Edit
      </button>
    </div>
  );
}
