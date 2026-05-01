import { X } from "lucide-react";
import { AboutTab } from "./AboutTab";
import { AppearanceTab } from "./AppearanceTab";
import { ShortcutsTab } from "./ShortcutsTab";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsPanel({ onClose, open }: SettingsPanelProps) {
  return (
    <aside className={open ? "overlay-panel" : "overlay-panel overlay-panel-hidden"} aria-label="Settings">
      <header className="panel-header">
        <h2>Settings</h2>
        <button className="icon-button" type="button" aria-label="Close settings" onClick={onClose}>
          <X size={14} strokeWidth={1.75} />
        </button>
      </header>
      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        <button type="button" role="tab" aria-selected="true">
          Appearance
        </button>
        <button type="button" role="tab">
          Shortcuts
        </button>
        <button type="button" role="tab">
          About
        </button>
      </div>
      <AppearanceTab />
      <ShortcutsTab />
      <AboutTab />
    </aside>
  );
}
