import { X } from "lucide-react";
import { extractText } from "../lib/content";
import { useNotesStore } from "../store/notes";

export function ArchivePanel() {
  const archiveOpen = useNotesStore((state) => state.archiveOpen);
  const archive = useNotesStore((state) => state.archive);
  const restoreItem = useNotesStore((state) => state.restoreItem);
  const deleteArchivedItem = useNotesStore((state) => state.deleteArchivedItem);
  const setArchiveOpen = useNotesStore((state) => state.setArchiveOpen);
  const sortedArchive = [...archive].sort((a, b) => b.archivedAt - a.archivedAt);

  return (
    <aside className={archiveOpen ? "overlay-panel" : "overlay-panel overlay-panel-hidden"} aria-label="Archive">
      <header className="panel-header">
        <h2>Archive</h2>
        <button className="icon-button" type="button" aria-label="Close archive" onClick={() => setArchiveOpen(false)}>
          <X size={14} strokeWidth={1.75} />
        </button>
      </header>
      <div className="archive-list">
        {sortedArchive.map((item) => (
          <article className="archive-row" key={item.id}>
            <button type="button" onClick={() => restoreItem(item.id, item.sourceTabExists ? "original" : "current")}>
              {extractText(item.content) || "Archived item"}
            </button>
            <span className={item.sourceTabExists ? "archive-tag" : "archive-tag orphan"}>{item.sourceTabTitle}</span>
            <button type="button" aria-label="Delete archived item" onClick={() => deleteArchivedItem(item.id)}>
              x
            </button>
          </article>
        ))}
      </div>
    </aside>
  );
}
