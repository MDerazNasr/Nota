import { createPortal } from "react-dom";

export type SlashCommand = "bold" | "italic" | "underline" | "link";

type SlashMenuProps = {
  items: SlashCommand[];
  position: { left: number; top: number };
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  onDismiss: () => void;
};

const DESCRIPTIONS: Record<SlashCommand, string> = {
  bold: "Bold text",
  italic: "Italic text",
  underline: "Underline text",
  link: "Insert hyperlink",
};

export function SlashMenu({ items, position, selectedIndex, onSelect, onDismiss }: SlashMenuProps) {
  return createPortal(
    <div className="slash-menu" role="menu" style={position} onKeyDown={(event) => event.key === "Escape" && onDismiss()}>
      {items.map((item, index) => (
        <button
          className={index === selectedIndex ? "slash-menu-item active" : "slash-menu-item"}
          key={item}
          type="button"
          onClick={() => onSelect(item)}
        >
          <span>/{item}</span>
          <small>{DESCRIPTIONS[item]}</small>
        </button>
      ))}
    </div>,
    document.body,
  );
}
