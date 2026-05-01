import { ArchivePanel } from "./components/ArchivePanel";
import { ItemList } from "./components/ItemList";
import { SettingsPanel } from "./components/Settings/SettingsPanel";
import { TabBar } from "./components/TabBar";
import { TitleBar } from "./components/TitleBar";

function App() {
  return (
    <main className="app-shell">
      <section className="app-surface">
        <TitleBar />
        <TabBar />
        <ItemList />
      </section>
      <SettingsPanel />
      <ArchivePanel />
    </main>
  );
}

export default App;
