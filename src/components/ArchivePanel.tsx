import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { extractText } from "../lib/content";
import type { ArchivedItem } from "../lib/types";
import { useNotesStore } from "../store/notes";

type RestorePrompt = {
  item: ArchivedItem;
  selectedIndex: number;
};

export function ArchivePanel() {
  const archiveOpen = useNotesStore((state) => state.archiveOpen);
  const archive = useNotesStore((state) => state.archive);
  const restoreItem = useNotesStore((state) => state.restoreItem);
  const deleteArchivedItem = useNotesStore((state) => state.deleteArchivedItem);
  const clearArchive = useNotesStore((state) => state.clearArchive);
  const setArchiveOpen = useNotesStore((state) => state.setArchiveOpen);
  const [focusIndex, setFocusIndex] = useState(0);
  const [restorePrompt, setRestorePrompt] = useState<RestorePrompt | null>(null);
  const [clearConfirming, setClearConfirming] = useState(false);
  const sortedArchive = useMemo(() => [...archive].sort((a, b) => b.archivedAt - a.archivedAt), [archive]);
  const focusableCount = sortedArchive.length + 1;

  useEffect(() => {
    if (!archiveOpen) {
      setRestorePrompt(null);
      setClearConfirming(false);
      return;
    }

    setFocusIndex((index) => Math.min(index, Math.max(0, focusableCount - 1)));
  }, [archiveOpen, focusableCount]);

  useEffect(() => {
    if (!archiveOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (restorePrompt) {
        handlePromptKey(event, restorePrompt, setRestorePrompt, restoreItem);
        return;
      }

      if (clearConfirming) {
        handleClearConfirmKey(event, clearArchive, setArchiveOpen, setClearConfirming);
        return;
      }

      if (event.key === "j") {
        event.preventDefault();
        setFocusIndex((index) => (index + 1) % focusableCount);
      } else if (event.key === "k") {
        event.preventDefault();
        setFocusIndex((index) => (index - 1 + focusableCount) % focusableCount);
      } else if (event.key === "Enter") {
        event.preventDefault();
        activateArchiveFocus(sortedArchive, focusIndex, restoreItem, setRestorePrompt, setClearConfirming);
      } else if (event.key === "x") {
        event.preventDefault();
        const item = sortedArchive[focusIndex];
        if (item) {
          deleteArchivedItem(item.id);
        }
      } else if (event.key === "Escape") {
        event.preventDefault();
        setArchiveOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    archiveOpen,
    clearArchive,
    clearConfirming,
    deleteArchivedItem,
    focusIndex,
    focusableCount,
    restoreItem,
    restorePrompt,
    setArchiveOpen,
    sortedArchive,
  ]);

  return (
    <aside className={archiveOpen ? "overlay-panel" : "overlay-panel overlay-panel-hidden"} aria-label="Archive">
      <header className="panel-header">
        <h2>Archive</h2>
        <button className="icon-button" type="button" aria-label="Close archive" onClick={() => setArchiveOpen(false)}>
          <X size={14} strokeWidth={1.75} />
        </button>
      </header>
      <div className="archive-list">
        {sortedArchive.map((item, index) =>
          restorePrompt?.item.id === item.id ? (
            <RestorePromptRow
              key={item.id}
              prompt={restorePrompt}
              onSelect={(destination) => {
                restoreItem(item.id, destination);
                setRestorePrompt(null);
              }}
            />
          ) : (
            <ArchiveRow
              focused={focusIndex === index}
              item={item}
              key={item.id}
              onDelete={() => deleteArchivedItem(item.id)}
              onRestore={() => restoreArchiveItem(item, restoreItem, setRestorePrompt)}
            />
          ),
        )}
      </div>
      <button
        className={focusIndex === sortedArchive.length ? "archive-clear focused" : "archive-clear"}
        type="button"
        onClick={() => setClearConfirming(true)}
      >
        {clearConfirming ? "Confirm? (y / esc)" : "Clear All"}
      </button>
    </aside>
  );
}

type ArchiveRowProps = {
  focused: boolean;
  item: ArchivedItem;
  onDelete: () => void;
  onRestore: () => void;
};

function ArchiveRow({ focused, item, onDelete, onRestore }: ArchiveRowProps) {
  return (
    <article className={focused ? "archive-row focused" : "archive-row"}>
      <button type="button" onClick={onRestore}>
        {extractText(item.content) || "Archived item"}
      </button>
      <span className={item.sourceTabExists ? "archive-tag" : "archive-tag orphan"}>{item.sourceTabTitle}</span>
      <button type="button" aria-label="Delete archived item" onClick={onDelete}>
        x
      </button>
    </article>
  );
}

type RestorePromptRowProps = {
  prompt: RestorePrompt;
  onSelect: (destination: "current" | string) => void;
};

function RestorePromptRow({ onSelect, prompt }: RestorePromptRowProps) {
  const newTabTitle = prompt.item.sourceTabTitle || "Untitled";

  return (
    <article className="archive-restore-prompt">
      <button
        className={prompt.selectedIndex === 0 ? "active" : ""}
        type="button"
        onClick={() => onSelect(newTabTitle)}
      >
        New tab ({newTabTitle})
      </button>
      <button
        className={prompt.selectedIndex === 1 ? "active" : ""}
        type="button"
        onClick={() => onSelect("current")}
      >
        Current tab
      </button>
    </article>
  );
}

function activateArchiveFocus(
  archive: ArchivedItem[],
  focusIndex: number,
  restoreItem: (archivedId: string, destination: "original" | "current" | string) => void,
  setRestorePrompt: (prompt: RestorePrompt | null) => void,
  setClearConfirming: (confirming: boolean) => void,
) {
  const item = archive[focusIndex];

  if (!item) {
    setClearConfirming(true);
    return;
  }

  restoreArchiveItem(item, restoreItem, setRestorePrompt);
}

function restoreArchiveItem(
  item: ArchivedItem,
  restoreItem: (archivedId: string, destination: "original" | "current" | string) => void,
  setRestorePrompt: (prompt: RestorePrompt | null) => void,
) {
  if (item.sourceTabExists) {
    restoreItem(item.id, "original");
  } else {
    setRestorePrompt({ item, selectedIndex: 0 });
  }
}

function handlePromptKey(
  event: KeyboardEvent,
  prompt: RestorePrompt,
  setRestorePrompt: (prompt: RestorePrompt | null) => void,
  restoreItem: (archivedId: string, destination: "current" | string) => void,
) {
  if (event.key === "j" || event.key === "k") {
    event.preventDefault();
    setRestorePrompt({ ...prompt, selectedIndex: prompt.selectedIndex === 0 ? 1 : 0 });
  } else if (event.key === "Enter") {
    event.preventDefault();
    restoreItem(prompt.item.id, prompt.selectedIndex === 0 ? prompt.item.sourceTabTitle || "Untitled" : "current");
    setRestorePrompt(null);
  } else if (event.key === "Escape") {
    event.preventDefault();
    setRestorePrompt(null);
  }
}

function handleClearConfirmKey(
  event: KeyboardEvent,
  clearArchive: () => void,
  setArchiveOpen: (open: boolean) => void,
  setClearConfirming: (confirming: boolean) => void,
) {
  if (event.key === "y") {
    event.preventDefault();
    clearArchive();
    setArchiveOpen(false);
  } else if (event.key === "Escape") {
    event.preventDefault();
    setClearConfirming(false);
  }
}
