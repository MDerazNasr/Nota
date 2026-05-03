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
      { key: "sortByTag", label: "Toggle tag sort" },
      { key: "undo", label: "Undo" },
    ],
  },
  {
    label: "Item movement",
    shortcuts: [{ key: "enterMoveMode", label: "Enter move mode" }],
  },
];

const REFERENCE_SECTIONS: Array<{
  label: string;
  rows: Array<{ keyCombo: string; label: string }>;
}> = [
  {
    label: "App navigation",
    rows: [
      { keyCombo: "J/K", label: "Move cursor" },
      { keyCombo: "H/L", label: "Switch tabs" },
      { keyCombo: "J/K", label: "Move settings selector" },
      { keyCombo: "Left/Right", label: "Adjust selected setting" },
      { keyCombo: "Left/Right on theme", label: "Cycle color schemes" },
      { keyCombo: "Up/Down on theme", label: "Cycle color schemes" },
    ],
  },
  {
    label: "Slash menu",
    rows: [
      { keyCombo: "/", label: "Open link and tag suggestions" },
      { keyCombo: "/anything", label: "Create or select a tag" },
      { keyCombo: "Enter", label: "Use suggestion" },
    ],
  },
  {
    label: "Task links",
    rows: [
      { keyCombo: "/link", label: "Open link fields" },
      { keyCombo: "Tab / N", label: "Move to URL field" },
      { keyCombo: "Shift+Tab / Shift+N", label: "Return to label field" },
      { keyCombo: "Enter", label: "Insert link" },
      { keyCombo: "Cmd+X", label: "Open focused task link" },
    ],
  },
  {
    label: "Task Vim modes",
    rows: [
      { keyCombo: "Esc", label: "Normal mode" },
      { keyCombo: "i / a / I / A", label: "Insert mode" },
      { keyCombo: "v / V", label: "Visual or line select" },
      { keyCombo: "Cmd+B / I / U", label: "Format selection" },
    ],
  },
  {
    label: "Task Vim movement",
    rows: [
      { keyCombo: "H/J/K/L", label: "Move inside task" },
      { keyCombo: "Arrows", label: "Move inside task" },
      { keyCombo: "W/B", label: "Jump by word" },
      { keyCombo: "Shift+W/B", label: "Jump by WORD" },
      { keyCombo: "0 / $", label: "Line start or end" },
      { keyCombo: "gg / G", label: "Task start or end" },
      { keyCombo: "%", label: "Matching bracket" },
    ],
  },
  {
    label: "Task Vim editing",
    rows: [
      { keyCombo: "u / Ctrl+R", label: "Undo or redo" },
      { keyCombo: "x", label: "Delete character" },
      { keyCombo: "yy / p", label: "Yank and paste line" },
      { keyCombo: "dd", label: "Delete line" },
      { keyCombo: "ciw / ciW", label: "Change word" },
      { keyCombo: "di( / da(", label: "Delete parentheses" },
      { keyCombo: "cit", label: "Change HTML tag" },
    ],
  },
  {
    label: "Task Vim search",
    rows: [
      { keyCombo: "/pattern", label: "Search task" },
      { keyCombo: "n / N", label: "Next or previous match" },
      { keyCombo: ":%s/old/new/g", label: "Replace all" },
      { keyCombo: ":%s/old/new/gc", label: "Confirm replacements" },
    ],
  },
  {
    label: "Task tags",
    rows: [
      { keyCombo: "/name", label: "Add tag to task" },
      { keyCombo: "/", label: "Select existing tag" },
      { keyCombo: "Right", label: "Enter tags from task" },
      { keyCombo: "Left / Right", label: "Move between tags" },
      { keyCombo: "Backspace", label: "Delete tag" },
      { keyCombo: "Left on first", label: "Return to task" },
      { keyCombo: "Cmd+.", label: "Toggle rarest-tag grouping" },
    ],
  },
  {
    label: "Move mode",
    rows: [
      { keyCombo: "Shift+J/K", label: "Range select" },
      { keyCombo: "Cmd+J/K", label: "Add one item" },
      { keyCombo: "J/K", label: "Reorder selection" },
      { keyCombo: "H/L or Left/Right", label: "Move to adjacent tab" },
      { keyCombo: "D", label: "Delete selected tasks" },
    ],
  },
];

export function ShortcutsTab() {
  const openOnStartup = useSettingsStore((state) => state.openOnStartup);
  const showInDock = useSettingsStore((state) => state.showInDock);
  const showInMenuBar = useSettingsStore((state) => state.showInMenuBar);
  const shortcuts = useSettingsStore((state) => state.shortcuts);
  const setOpenOnStartup = useSettingsStore((state) => state.setOpenOnStartup);
  const setShowInDock = useSettingsStore((state) => state.setShowInDock);
  const setShowInMenuBar = useSettingsStore((state) => state.setShowInMenuBar);
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
      {REFERENCE_SECTIONS.map((section) => (
        <div className="hotkey-section" key={section.label}>
          <div className="hotkey-section-label">{section.label}</div>
          {section.rows.map((row) => (
            <ReferenceRow key={`${section.label}-${row.label}`} label={row.label} value={row.keyCombo} />
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

type ReferenceRowProps = {
  label: string;
  value: string;
};

function ReferenceRow({ label, value }: ReferenceRowProps) {
  return (
    <div className="shortcut-reference-row" data-settings-row="reference" tabIndex={-1}>
      <span>{label}</span>
      <kbd>{value}</kbd>
    </div>
  );
}
