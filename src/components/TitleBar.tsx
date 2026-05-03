import { getCurrentWindow } from "@tauri-apps/api/window";
import { Settings, Tags } from "lucide-react";
import type { MouseEvent } from "react";
import { shouldStartWindowDrag } from "../lib/windowDrag";
import { useNotesStore } from "../store/notes";

type TitleBarProps = {
  onOpenSettings?: () => void;
};

export function TitleBar({ onOpenSettings }: TitleBarProps) {
  const tabs = useNotesStore((state) => state.tabs);
  const activeTabId = useNotesStore((state) => state.activeTabId);
  const sortActiveTabByTag = useNotesStore((state) => state.sortActiveTabByTag);
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const canSortByTag = Boolean(activeTab?.items.some((item) => item.tags.length > 0));

  const minimizeWindow = async () => {
    await getCurrentWindow().minimize().catch(console.error);
  };

  const hideWindow = async () => {
    await getCurrentWindow().hide().catch(console.error);
  };

  const startWindowDrag = async (event: MouseEvent<HTMLElement>) => {
    if (event.button !== 0 || !shouldStartWindowDrag(event.target, event.currentTarget)) {
      return;
    }

    await getCurrentWindow().startDragging().catch(console.error);
  };

  return (
    <header className="title-bar" data-tauri-drag-region onMouseDown={startWindowDrag}>
      <div className="window-dots" aria-hidden="true">
        <button className="dot dot-close" type="button" onClick={hideWindow} />
        <button className="dot dot-minimize" type="button" onClick={minimizeWindow} />
        <span className="dot dot-disabled" />
      </div>
      <span className="title-bar-name">nota</span>
      <div className="title-bar-actions">
        <button
          className="icon-button"
          type="button"
          aria-label="Sort by tag"
          disabled={!canSortByTag}
          title="Sort by rarest tag"
          onClick={sortActiveTabByTag}
        >
          <Tags size={14} strokeWidth={1.75} />
        </button>
        <button className="icon-button" type="button" aria-label="Open settings" onClick={onOpenSettings}>
          <Settings size={14} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
