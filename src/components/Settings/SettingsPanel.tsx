import { AboutTab } from "./AboutTab";
import { AppearanceTab } from "./AppearanceTab";
import { ShortcutsTab } from "./ShortcutsTab";

export function SettingsPanel() {
  return (
    <aside className="overlay-panel overlay-panel-hidden" aria-label="Settings">
      <header className="panel-header">
        <h2>Settings</h2>
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
