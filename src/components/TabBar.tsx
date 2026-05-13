import { useEffect, useRef, useState } from "react";
import { useNotesStore } from "../store/notes";

export function TabBar() {
  const tabs = useNotesStore((state) => state.tabs);
  const activeTabId = useNotesStore((state) => state.activeTabId);
  const editingTabId = useNotesStore((state) => state.editingTabId);
  const mode = useNotesStore((state) => state.mode);
  const createTab = useNotesStore((state) => state.createTab);
  const deleteTab = useNotesStore((state) => state.deleteTab);
  const dropTargetTabId = useNotesStore((state) => state.dropTargetTabId);
  const setActiveTab = useNotesStore((state) => state.setActiveTab);
  const setEditingTabId = useNotesStore((state) => state.setEditingTabId);
  const updateTabTitle = useNotesStore((state) => state.updateTabTitle);
  const [contextTabId, setContextTabId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  useEffect(() => {
    const tab = tabs.find((entry) => entry.id === editingTabId);
    setDraftTitle(tab?.title ?? "");
  }, [editingTabId, tabs]);

  const confirmTitle = (id: string) => {
    updateTabTitle(id, draftTitle);
  };

  return (
    <nav className="tab-bar" aria-label="Tabs" onMouseLeave={() => setContextTabId(null)}>
      {tabs.map((tab) => (
        <div
          className={dropTargetTabId === tab.id ? "tab-wrap drop-target" : "tab-wrap"}
          data-tab-id={tab.id}
          key={tab.id}
        >
          {editingTabId === tab.id ? (
            <TabTitleInput
              title={draftTitle}
              onChange={setDraftTitle}
              onConfirm={() => confirmTitle(tab.id)}
              onCancel={() => confirmTitle(tab.id)}
            />
          ) : (
            <button
              className={tabClassName(tab.id === activeTabId, mode)}
              type="button"
              title={tab.title}
              onClick={() => setActiveTab(tab.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                setContextTabId(tab.id);
              }}
              onDoubleClick={() => setEditingTabId(tab.id)}
            >
              {tab.title}
            </button>
          )}
          <button
            className="tab-delete"
            type="button"
            aria-label={`Delete ${tab.title}`}
            onClick={(event) => {
              event.stopPropagation();
              deleteTab(tab.id);
            }}
          >
            x
          </button>
          {contextTabId === tab.id ? (
            <button className="tab-context" type="button" onClick={() => deleteTab(tab.id)}>
              Delete Tab
            </button>
          ) : null}
        </div>
      ))}
      <button className="tab-add" type="button" aria-label="New tab" onClick={createTab}>
        +
      </button>
    </nav>
  );
}

function tabClassName(active: boolean, mode: string) {
  return [
    "tab-pill",
    active ? "active" : "",
    active && mode === "tabs" ? "tab-focused" : "",
    active && mode === "tab-move" ? "tab-moving" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

type TabTitleInputProps = {
  title: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

function TabTitleInput({ onCancel, onChange, onConfirm, title }: TabTitleInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <input
      ref={inputRef}
      className="tab-title-input"
      maxLength={40}
      value={title}
      onBlur={onConfirm}
      onChange={(event) => onChange(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        } else if (event.key === "Escape") {
          onCancel();
        }
      }}
    />
  );
}
