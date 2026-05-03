import { useMemo } from "react";
import { Tags } from "lucide-react";
import { useSettingsStore } from "../store/settings";
import { useNotesStore } from "../store/notes";
import { Item } from "./Item";

export function ItemList() {
  const tabs = useNotesStore((state) => state.tabs);
  const activeTabId = useNotesStore((state) => state.activeTabId);
  const cursorIndex = useNotesStore((state) => state.cursorIndex);
  const itemDropTarget = useNotesStore((state) => state.itemDropTarget);
  const selectedItemIds = useNotesStore((state) => state.selectedItemIds);
  const sortActiveTabByTag = useNotesStore((state) => state.sortActiveTabByTag);
  const itemLimit = useSettingsStore((state) => state.itemLimit);
  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId), [activeTabId, tabs]);
  const canSortByTag = Boolean(activeTab?.items.some((item) => item.tags.length > 0));

  return (
    <section className="item-list" aria-label="Items">
      <div className="item-list-actions">
        <button
          className="item-list-action"
          type="button"
          disabled={!canSortByTag}
          title="Sort by rarest tag"
          onClick={sortActiveTabByTag}
        >
          <Tags size={13} strokeWidth={1.75} />
          <span>Sort by tag</span>
        </button>
      </div>
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
    </section>
  );
}
