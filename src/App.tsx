import { useState } from "react";
import { ArchivePanel } from "./components/ArchivePanel";
import { ItemList } from "./components/ItemList";
import { SettingsPanel } from "./components/Settings/SettingsPanel";
import { TabBar } from "./components/TabBar";
import { TitleBar } from "./components/TitleBar";
import { useKeymap } from "./hooks/useKeymap";
import { useNotesStore } from "./store/notes";

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const setArchiveOpen = useNotesStore((state) => state.setArchiveOpen);

  useKeymap({ settingsOpen, setSettingsOpen });

  const openSettings = () => {
    setArchiveOpen(false);
    setSettingsOpen(true);
  };

  return (
    <main className="app-shell">
      <section className="app-surface">
        <TitleBar onOpenSettings={openSettings} />
        <TabBar />
        <ItemList />
      </section>
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ArchivePanel />
    </main>
  );
}

export default App;
