import { createPortal } from "react-dom";
import type { SlashMenuItem } from "../lib/slashCommands";

type SlashMenuProps = {
  items: SlashMenuItem[];
  position: { left: number; top: number };
  selectedIndex: number;
  onSelect: (item: SlashMenuItem) => void;
  onDismiss: () => void;
};

export function SlashMenu({ items, position, selectedIndex, onSelect, onDismiss }: SlashMenuProps) {
  return createPortal(
    <div className="slash-menu" role="menu" style={position} onKeyDown={(event) => event.key === "Escape" && onDismiss()}>
      {items.map((item, index) => (
        <button
          className={index === selectedIndex ? "slash-menu-item active" : "slash-menu-item"}
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
        >
          <span className="slash-menu-label">
            {item.kind === "tag" ? <span className="slash-menu-dot" style={{ backgroundColor: item.tag.color }} /> : null}
            {item.label}
          </span>
          <small>{item.description}</small>
        </button>
      ))}
    </div>,
    document.body,
  );
}
