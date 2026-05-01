import { getCurrentWindow } from "@tauri-apps/api/window";
import { Settings } from "lucide-react";
import type { MouseEvent } from "react";
import { shouldStartWindowDrag } from "../lib/windowDrag";

type TitleBarProps = {
  onOpenSettings?: () => void;
};

export function TitleBar({ onOpenSettings }: TitleBarProps) {
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
      <button className="icon-button" type="button" aria-label="Open settings" onClick={onOpenSettings}>
        <Settings size={14} strokeWidth={1.75} />
      </button>
    </header>
  );
}
