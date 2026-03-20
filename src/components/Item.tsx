import { useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/core";
import { invoke } from "@tauri-apps/api/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { GripVertical } from "lucide-react";
import { createItemDragPayload, ITEM_DRAG_MIME } from "../lib/itemDrag";
import { normalizeHref } from "../lib/links";
import { filterSlashCommands, nextSlashIndex } from "../lib/slashCommands";
import type { Item as ItemModel } from "../lib/types";
import { useNotesStore } from "../store/notes";
import { LinkPopup } from "./LinkPopup";
import { SlashMenu, type SlashCommand } from "./SlashMenu";

type SlashState = {
  query: string;
  range: { from: number; to: number };
  selectedIndex: number;
  position: { left: number; top: number };
};

type LinkPopupState = {
  position: { left: number; top: number };
};

type ItemProps = {
  item: ItemModel;
  focused: boolean;
  index: number;
  selected: boolean;
  tabId: string;
};

export function Item({ focused, index, item, selected, tabId }: ItemProps) {
  const mode = useNotesStore((state) => state.mode);
  const setCursorIndex = useNotesStore((state) => state.setCursorIndex);
  const setMode = useNotesStore((state) => state.setMode);
  const selectedItemIds = useNotesStore((state) => state.selectedItemIds);
  const checkItem = useNotesStore((state) => state.checkItem);
  const setSelectedItemIds = useNotesStore((state) => state.setSelectedItemIds);
  const toggleItemSelection = useNotesStore((state) => state.toggleItemSelection);
  const updateItemContent = useNotesStore((state) => state.updateItemContent);
  const [slashState, setSlashState] = useState<SlashState | null>(null);
  const [linkPopup, setLinkPopup] = useState<LinkPopupState | null>(null);
  const slashItems = useMemo(() => filterSlashCommands(slashState?.query ?? ""), [slashState?.query]);
  const editable = focused && mode === "edit";
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        codeBlock: false,
        blockquote: false,
        hardBreak: false,
        heading: false,
        horizontalRule: false,
        orderedList: false,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
    ],
    content: item.content,
    editable,
    editorProps: {
      attributes: {
        class: "item-editor",
      },
      handleKeyDown: (view, event) => {
        if (slashState) {
          const handled = handleSlashKey(event, slashState, slashItems, setSlashState, (command) => {
            applySlashCommand(editor, slashState, command, setLinkPopup);
          }, () => dismissSlashMenu(editor, slashState.range, setSlashState));

          if (handled) {
            return true;
          }
        }

        if (event.key === "Escape") {
          event.preventDefault();
          setMode("nav");
          view.dom.blur();
          return true;
        }

        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          checkItem(tabId, item.id);
          return true;
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
          event.preventDefault();
          editor?.chain().focus().toggleBold().run();
          return true;
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "i") {
          event.preventDefault();
          editor?.chain().focus().toggleItalic().run();
          return true;
        }

        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "u") {
          event.preventDefault();
          editor?.chain().focus().toggleUnderline().run();
          return true;
        }

        return false;
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target;

        if (target instanceof HTMLAnchorElement) {
          event.preventDefault();
          void invoke("open_url", { url: target.href });
          return true;
        }

        return false;
      },
    },
    onFocus: () => setMode("edit"),
    onBlur: () => {
      setMode("nav");
      setSlashState(null);
    },
    onUpdate: ({ editor: activeEditor }) => {
      updateItemContent(tabId, item.id, activeEditor.getJSON());
      setSlashState(readSlashState(activeEditor));
    },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editable, editor]);

  useEffect(() => {
    if (editable) {
      editor?.commands.focus("end");
    }
  }, [editable, editor]);

  return (
    <article
      className={rowClassName(focused, selected)}
      data-state={item.state}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) {
          toggleItemSelection(item.id);
          return;
        }

        setCursorIndex(index);
        setSelectedItemIds([]);
        setMode("edit");
      }}
    >
      <button
        className="item-drag-handle"
        type="button"
        draggable
        aria-label="Drag item"
        onClick={(event) => event.stopPropagation()}
        onDragStart={(event) => {
          event.stopPropagation();
          const draggedIds = selectedItemIds.includes(item.id) ? selectedItemIds : [item.id];
          setSelectedItemIds(draggedIds);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData(ITEM_DRAG_MIME, createItemDragPayload(draggedIds));
        }}
      >
        <GripVertical size={14} strokeWidth={1.75} />
      </button>
      <button
        className="item-check"
        type="button"
        aria-label={selected ? "Deselect item" : "Select item"}
        onClick={(event) => {
          event.stopPropagation();
          toggleItemSelection(item.id);
        }}
      />
      <EditorContent editor={editor} />
      {slashState && slashItems.length > 0 ? (
        <SlashMenu
          items={slashItems}
          position={slashState.position}
          selectedIndex={Math.min(slashState.selectedIndex, slashItems.length - 1)}
          onDismiss={() => dismissSlashMenu(editor, slashState.range, setSlashState)}
          onSelect={(command) => applySlashCommand(editor, slashState, command, setLinkPopup)}
        />
      ) : null}
      {linkPopup ? (
        <LinkPopup
          position={linkPopup.position}
          onCancel={() => setLinkPopup(null)}
          onSubmit={(label, url) => {
            insertLink(editor, label, url);
            setLinkPopup(null);
          }}
        />
      ) : null}
    </article>
  );
}

function rowClassName(focused: boolean, selected: boolean) {
  return ["item-row", focused ? "focused" : "", selected ? "selected" : ""].filter(Boolean).join(" ");
}

function readSlashState(editor: Editor): SlashState | null {
  const { selection } = editor.state;

  if (!selection.empty) {
    return null;
  }

  const { $from } = selection;
  const beforeCursor = $from.parent.textBetween(0, $from.parentOffset, undefined, "\ufffc");
  const match = /(?:^|\s)\/([a-z]*)$/i.exec(beforeCursor);

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

function handleSlashKey(
  event: KeyboardEvent,
  slashState: SlashState,
  slashItems: SlashCommand[],
  setSlashState: (state: SlashState | null) => void,
  onSelect: (command: SlashCommand) => void,
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

function applySlashCommand(
  editor: Editor | null,
  slashState: SlashState,
  command: SlashCommand,
  setLinkPopup: (state: LinkPopupState | null) => void,
) {
  if (!editor) {
    return;
  }

  const chain = editor.chain().focus().deleteRange(slashState.range);

  if (command === "link") {
    chain.run();
    setLinkPopup({ position: slashState.position });
    return;
  }

  if (command === "bold") {
    chain.toggleBold().run();
  } else if (command === "italic") {
    chain.toggleItalic().run();
  } else if (command === "underline") {
    chain.toggleUnderline().run();
  }
}

function insertLink(editor: Editor | null, label: string, url: string) {
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

function dismissSlashMenu(editor: Editor | null, range: SlashState["range"], setSlashState: (state: SlashState | null) => void) {
  editor?.chain().focus().deleteRange(range).run();
  setSlashState(null);
}
