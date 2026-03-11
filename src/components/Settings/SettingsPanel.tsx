import { useState } from "react";
import { X } from "lucide-react";
import { AboutTab } from "./AboutTab";
import { AppearanceTab } from "./AppearanceTab";
import { ShortcutsTab } from "./ShortcutsTab";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function SettingsPanel({ onClose, open }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<"appearance" | "shortcuts" | "about">("appearance");

  return (
    <aside className={open ? "overlay-panel" : "overlay-panel overlay-panel-hidden"} aria-label="Settings">
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
