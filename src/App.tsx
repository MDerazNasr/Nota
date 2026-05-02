import { useState } from "react";
import { ItemList } from "./components/ItemList";
import { SettingsPanel } from "./components/Settings/SettingsPanel";
import { TabBar } from "./components/TabBar";
import { TitleBar } from "./components/TitleBar";
import { useKeymap } from "./hooks/useKeymap";

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  useKeymap({ settingsOpen, setSettingsOpen });

  return (
    <main className="app-shell">
      <section className="app-surface">
        <TitleBar onOpenSettings={() => setSettingsOpen(true)} />
        <TabBar />
        <ItemList />
      </section>
      {settingsOpen ? <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} /> : null}
    </main>
  );
}

export default App;
