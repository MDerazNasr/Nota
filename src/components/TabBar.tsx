import { useNotesStore } from "../store/notes";

export function TabBar() {
  const tabs = useNotesStore((state) => state.tabs);
  const activeTabId = useNotesStore((state) => state.activeTabId);
  const createTab = useNotesStore((state) => state.createTab);
  const setActiveTab = useNotesStore((state) => state.setActiveTab);

  return (
    <nav className="tab-bar" aria-label="Tabs">
      {tabs.map((tab) => (
        <button
          className={tab.id === activeTabId ? "tab-pill active" : "tab-pill"}
          key={tab.id}
          type="button"
          title={tab.title}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.title}
        </button>
      ))}
      <button className="tab-add" type="button" aria-label="New tab" onClick={createTab}>
        +
      </button>
    </nav>
  );
}
