import type { Editor } from "@tiptap/core";
import { normalizeHref } from "./links";
import { nextSlashIndex, type SlashMenuItem } from "./slashCommands";

export type SlashState = {
  query: string;
  range: { from: number; to: number };
  selectedIndex: number;
  position: { left: number; top: number };
};

export type LinkPopupState = {
  position: { left: number; top: number };
};

export function readSlashState(editor: Editor): SlashState | null {
  const { selection } = editor.state;

  if (!selection.empty) {
    return null;
  }

  const { $from } = selection;
  const beforeCursor = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
  const match = /(?:^|\s)\/([^/]*)$/.exec(beforeCursor);

  if (!match) {
    return null;
  }

  const query = match[1];
  const from = $from.pos - query.length - 1;
  const coords = editor.view.coordsAtPos($from.pos);

  return {
    query,
    range: { from, to: $from.pos },
    selectedIndex: 0,
    position: { left: coords.left, top: coords.bottom + 4 },
  };
}

export function handleSlashKey(
  event: KeyboardEvent,
  slashState: SlashState,
  slashItems: SlashMenuItem[],
  setSlashState: (state: SlashState | null) => void,
  onSelect: (item: SlashMenuItem) => void,
  onDismiss: () => void,
) {
  if (event.key === "j" || event.key === "ArrowDown") {
    event.preventDefault();
    setSlashState({ ...slashState, selectedIndex: nextSlashIndex(slashState.selectedIndex, "down", slashItems.length) });
    return true;
  }

  if (event.key === "k" || event.key === "ArrowUp") {
    event.preventDefault();
    setSlashState({ ...slashState, selectedIndex: nextSlashIndex(slashState.selectedIndex, "up", slashItems.length) });
    return true;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const command = slashItems[slashState.selectedIndex];
    if (command) {
      onSelect(command);
    }
    return true;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    onDismiss();
    return true;
  }

  return false;
}

export function applySlashItem(
  editor: Editor | null,
  slashState: SlashState,
  item: SlashMenuItem,
  addItemTag: (tagName: string) => void,
  setLinkPopup: (state: LinkPopupState | null) => void,
  setSlashState: (state: SlashState | null) => void,
) {
  if (!editor) {
    return;
  }

  const chain = editor.chain().focus().deleteRange(slashState.range);

  if (item.kind === "command" && item.command === "link") {
    chain.run();
    setLinkPopup({ position: slashState.position });
    setSlashState(null);
    return;
  }

  if (item.kind === "tag") {
    chain.run();
    addItemTag(item.tag.name);
    setSlashState(null);
    return;
  }

  if (item.kind === "create-tag") {
    chain.run();
    addItemTag(item.name);
    setSlashState(null);
  }
}

export function insertLink(editor: Editor | null, label: string, url: string) {
  editor
    ?.chain()
    .focus()
    .insertContent({
      type: "text",
      text: label,
      marks: [{ type: "link", attrs: { href: normalizeHref(url) } }],
    })
    .run();
}

export function dismissSlashMenu(editor: Editor | null, range: SlashState["range"], setSlashState: (state: SlashState | null) => void) {
  editor?.chain().focus().deleteRange(range).run();
  setSlashState(null);
}
