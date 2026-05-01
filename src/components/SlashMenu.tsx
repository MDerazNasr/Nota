export type SlashCommand = "bold" | "italic" | "underline" | "link";

type SlashMenuProps = {
  items: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
  onDismiss: () => void;
};

export function SlashMenu({ items, selectedIndex, onSelect, onDismiss }: SlashMenuProps) {
  return (
    <div className="slash-menu" role="menu" onKeyDown={(event) => event.key === "Escape" && onDismiss()}>
      {items.map((item, index) => (
        <button
          className={index === selectedIndex ? "slash-menu-item active" : "slash-menu-item"}
          key={item}
          type="button"
          onClick={() => onSelect(item)}
        >
          /{item}
        </button>
      ))}
    </div>
  );
}
