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

    const rows = getSettingsRows(panelRef.current);
    rows[focusIndex]?.focus();
  }, [activeTab, focusIndex, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreSettingsKey(event.target)) {
        return;
      }

      const rows = getSettingsRows(panelRef.current);

      if (event.key === "j") {
        event.preventDefault();
        setFocusIndex((current) => moveSettingsFocus(current, 1, rows.length));
      } else if (event.key === "k") {
        event.preventDefault();
        setFocusIndex((current) => moveSettingsFocus(current, -1, rows.length));
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
        activateSettingsRow(rows[focusIndex]);
      } else if (event.key === " ") {
        event.preventDefault();
        activateSettingsRow(rows[focusIndex]);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        adjustSettingsRow(rows[focusIndex], -1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        adjustSettingsRow(rows[focusIndex], 1);
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
          onClick={() => {
            setActiveTab("appearance");
            setFocusIndex(0);
          }}
        >
          Appearance
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "shortcuts"}
          onClick={() => {
            setActiveTab("shortcuts");
            setFocusIndex(0);
          }}
        >
          Navigation
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "about"}
          onClick={() => {
            setActiveTab("about");
            setFocusIndex(0);
          }}
        >
          About
        </button>
      </div>
      {activeTab === "appearance" ? <AppearanceTab /> : null}
      {activeTab === "shortcuts" ? <ShortcutsTab /> : null}
      {activeTab === "about" ? <AboutTab /> : null}
    </aside>
  );
}

function getSettingsRows(panel: HTMLElement | null) {
  if (!panel) {
    return [];
  }

  return Array.from(panel.querySelectorAll<HTMLElement>("[data-settings-row]")).filter(
    (element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0,
  );
}

function activateSettingsRow(row: HTMLElement | undefined) {
  if (!row) {
    return;
  }

  if (row.dataset.settingsRow === "theme") {
    clickTheme(row, 1);
    return;
  }

  const control = row.querySelector<HTMLElement>("[data-settings-primary]");

  if (!control) {
    return;
  }

  control.focus();

  if (control instanceof HTMLButtonElement || isCheckbox(control)) {
    control.click();
  } else if (control instanceof HTMLSelectElement) {
    control.click();
  }
}

function adjustSettingsRow(row: HTMLElement | undefined, offset: -1 | 1) {
  if (!row) {
    return;
  }

  if (row.dataset.settingsRow === "theme") {
    clickTheme(row, offset);
    return;
  }

  const control = row.querySelector<HTMLElement>("[data-settings-primary]");

  if (control instanceof HTMLInputElement && control.type === "range") {
    const step = Number(control.step || 1);
    const nextValue = Number(control.value) + step * offset;
    control.value = String(nextValue);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (control instanceof HTMLSelectElement) {
    const nextIndex = Math.min(Math.max(control.selectedIndex + offset, 0), control.options.length - 1);
    control.selectedIndex = nextIndex;
    control.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (isCheckbox(control)) {
    control.checked = offset > 0;
    control.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function clickTheme(row: HTMLElement, offset: -1 | 1) {
  const swatches = Array.from(row.querySelectorAll<HTMLButtonElement>(".theme-swatch"));
  const activeIndex = swatches.findIndex((swatch) => swatch.classList.contains("active"));
  const next = swatches[(activeIndex + offset + swatches.length) % swatches.length];
  next?.click();
}

function isCheckbox(element: HTMLElement | null): element is HTMLInputElement {
  return element instanceof HTMLInputElement && element.type === "checkbox";
}

function shouldIgnoreSettingsKey(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.closest("[data-hotkey-capturing='true']") !== null;
}
