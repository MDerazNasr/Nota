import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { moveSettingsFocus, moveSettingsTab, type SettingsTab } from "../../lib/settingsNav";
import { AboutTab } from "./AboutTab";
import { AppearanceTab } from "./AppearanceTab";
import { ShortcutsTab } from "./ShortcutsTab";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsPanel({ onClose, open }: SettingsPanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [focusIndex, setFocusIndex] = useState(0);

  useEffect(() => {
    if (open) {
      setActiveTab("appearance");
      setFocusIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const focusables = getSettingsFocusables(panelRef.current);
    focusables[focusIndex]?.focus();
  }, [activeTab, focusIndex, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreSettingsKey(event.target)) {
        return;
      }

      const focusables = getSettingsFocusables(panelRef.current);

      if (event.key === "j") {
        event.preventDefault();
        setFocusIndex((current) => moveSettingsFocus(current, 1, focusables.length));
      } else if (event.key === "k") {
        event.preventDefault();
        setFocusIndex((current) => moveSettingsFocus(current, -1, focusables.length));
      } else if (event.key === "h") {
        event.preventDefault();
        setActiveTab((current) => moveSettingsTab(current, -1));
        setFocusIndex(0);
      } else if (event.key === "l") {
        event.preventDefault();
        setActiveTab((current) => moveSettingsTab(current, 1));
        setFocusIndex(0);
      } else if (event.key === "Enter") {
        event.preventDefault();
        activateSettingsControl(focusables[focusIndex]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusIndex, onClose, open]);

  return (
    <aside
      ref={panelRef}
      className={open ? "overlay-panel" : "overlay-panel overlay-panel-hidden"}
      aria-label="Settings"
      aria-hidden={!open}
    >
      <header className="panel-header">
        <h2>Settings</h2>
        <button className="icon-button" type="button" aria-label="Close settings" onClick={onClose}>
          <X size={14} strokeWidth={1.75} />
        </button>
      </header>
      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "appearance"}
          onClick={() => setActiveTab("appearance")}
        >
          Appearance
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "shortcuts"}
          onClick={() => setActiveTab("shortcuts")}
        >
          Shortcuts
        </button>
        <button type="button" role="tab" aria-selected={activeTab === "about"} onClick={() => setActiveTab("about")}>
          About
        </button>
      </div>
      {activeTab === "appearance" ? <AppearanceTab /> : null}
      {activeTab === "shortcuts" ? <ShortcutsTab /> : null}
      {activeTab === "about" ? <AboutTab /> : null}
    </aside>
  );
}

function getSettingsFocusables(panel: HTMLElement | null) {
  if (!panel) {
    return [];
  }

  return Array.from(panel.querySelectorAll<HTMLElement>("[data-settings-focusable]")).filter(
    (element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0,
  );
}

function activateSettingsControl(element: HTMLElement | undefined) {
  if (!element) {
    return;
  }

  element.focus();

  if (element instanceof HTMLButtonElement || isCheckbox(element)) {
    element.click();
  }
}

function isCheckbox(element: HTMLElement) {
  return element instanceof HTMLInputElement && element.type === "checkbox";
}

function shouldIgnoreSettingsKey(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.closest("[data-hotkey-capturing='true']") !== null;
}
