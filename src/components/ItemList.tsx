import { useMemo } from "react";
import { useSettingsStore } from "../store/settings";
import { useNotesStore } from "../store/notes";
import { Item } from "./Item";

export function ItemList() {
  const tabs = useNotesStore((state) => state.tabs);
  const activeTabId = useNotesStore((state) => state.activeTabId);
  const archive = useNotesStore((state) => state.archive);
  const cursorIndex = useNotesStore((state) => state.cursorIndex);
  const itemDropTarget = useNotesStore((state) => state.itemDropTarget);
  const selectedItemIds = useNotesStore((state) => state.selectedItemIds);
  const setArchiveOpen = useNotesStore((state) => state.setArchiveOpen);
  const itemLimit = useSettingsStore((state) => state.itemLimit);
  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId), [activeTabId, tabs]);
  const archivedCount = archive.filter((item) => item.sourceTabId === activeTabId).length;

  return (
    <section className="item-list" aria-label="Items">
      {!activeTab || activeTab.items.length === 0 ? (
        <p className="empty-state">Press o to add an item</p>
      ) : (
        activeTab.items.map((item, index) => (
          <Item
            focused={index === cursorIndex}
            index={index}
            item={item}
            key={item.id}
            dropPosition={itemDropTarget?.itemId === item.id ? itemDropTarget.position : null}
            selected={selectedItemIds.includes(item.id)}
            tabId={activeTab.id}
          />
        ))
      )}
      {activeTab && activeTab.items.length === itemLimit ? <p className="limit-row">limit reached</p> : null}
      {archivedCount > 0 ? (
        <button className="archive-toggle" type="button" onClick={() => setArchiveOpen(true)}>
          Archive
          <span>{archivedCount}</span>
        </button>
      ) : null}
    </section>
  );
}
