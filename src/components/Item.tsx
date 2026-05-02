import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { invoke } from "@tauri-apps/api/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { GripVertical } from "lucide-react";
import { handleEditorModeKey, type ItemEditorMode } from "../lib/itemEditorVim";
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

type CursorRect = {
  height: number;
  left: number;
  top: number;
};

type ItemProps = {
  item: ItemModel;
  dropPosition: "before" | "after" | null;
  focused: boolean;
  index: number;
  selected: boolean;
  tabId: string;
};

type PointerDragTarget =
  | { kind: "item"; itemId: string; position: "before" | "after"; tabId: string }
  | { kind: "tab"; tabId: string }
  | null;

export function Item({ dropPosition, focused, index, item, selected, tabId }: ItemProps) {
  const rowRef = useRef<HTMLElement>(null);
  const mode = useNotesStore((state) => state.mode);
  const setCursorIndex = useNotesStore((state) => state.setCursorIndex);
  const setMode = useNotesStore((state) => state.setMode);
  const selectedItemIds = useNotesStore((state) => state.selectedItemIds);
  const cancelItemDrag = useNotesStore((state) => state.cancelItemDrag);
  const checkItem = useNotesStore((state) => state.checkItem);
  const finishItemDrag = useNotesStore((state) => state.finishItemDrag);
  const finishItemDragAtItem = useNotesStore((state) => state.finishItemDragAtItem);
  const setSelectedItemIds = useNotesStore((state) => state.setSelectedItemIds);
  const setItemDropTarget = useNotesStore((state) => state.setItemDropTarget);
  const setDropTargetTabId = useNotesStore((state) => state.setDropTargetTabId);
  const startItemDrag = useNotesStore((state) => state.startItemDrag);
  const toggleItemSelection = useNotesStore((state) => state.toggleItemSelection);
  const updateItemContent = useNotesStore((state) => state.updateItemContent);
  const [editorMode, setEditorMode] = useState<ItemEditorMode>("insert");
  const [cursorRect, setCursorRect] = useState<CursorRect | null>(null);
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
        if (handleEditorModeKey(event, editor, editorMode, setEditorMode, () => {
          setMode("nav");
          view.dom.blur();
        })) {
          return true;
        }

        if (slashState) {
          const handled = handleSlashKey(event, slashState, slashItems, setSlashState, (command) => {
            applySlashCommand(editor, slashState, command, setLinkPopup, setSlashState);
          }, () => dismissSlashMenu(editor, slashState.range, setSlashState));

          if (handled) {
            return true;
          }
        }

        if (event.key === "Escape") {
          event.preventDefault();
          setEditorMode("normal");
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
      setSlashState(null);
      window.setTimeout(() => {
        if (!(document.activeElement instanceof HTMLElement) || !document.activeElement.closest(".link-popup")) {
          useNotesStore.getState().setMode("nav");
        }
      }, 0);
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
      setEditorMode("insert");
      editor?.commands.focus("end");
    }
  }, [editable, editor]);

  useEffect(() => {
    if (!editor || !editable || editorMode === "insert") {
      setCursorRect(null);
      return;
    }

    const updateCursor = () => {
      const row = rowRef.current;

      if (!row) {
        setCursorRect(null);
        return;
      }

      try {
        const coords = editor.view.coordsAtPos(editor.state.selection.to);
        const rowRect = row.getBoundingClientRect();

        setCursorRect({
          height: Math.max(16, coords.bottom - coords.top),
          left: coords.left - rowRect.left,
          top: coords.top - rowRect.top,
        });
      } catch {
        setCursorRect(null);
      }
    };

    updateCursor();
    editor.on("selectionUpdate", updateCursor);
    editor.on("transaction", updateCursor);
    window.addEventListener("resize", updateCursor);

    return () => {
      editor.off("selectionUpdate", updateCursor);
      editor.off("transaction", updateCursor);
      window.removeEventListener("resize", updateCursor);
    };
  }, [editable, editor, editorMode]);

  return (
    <article
      ref={rowRef}
      className={rowClassName(focused, selected, dropPosition)}
      data-editor-mode={editable ? editorMode : undefined}
      data-item-id={item.id}
      data-state={item.state}
      data-tab-id={tabId}
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
        aria-label="Drag item"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          const draggedIds = selectedItemIds.includes(item.id) ? selectedItemIds : [item.id];
          setSelectedItemIds(draggedIds);
          startItemDrag(draggedIds);

          const handlePointerMove = (pointerEvent: PointerEvent) => {
            updatePointerDragTarget(getPointerDragTarget(pointerEvent.clientX, pointerEvent.clientY));
          };
          const handlePointerUp = (pointerEvent: PointerEvent) => {
            const target = getPointerDragTarget(pointerEvent.clientX, pointerEvent.clientY);
            if (target?.kind === "item") {
              finishItemDragAtItem(target);
            } else {
              finishItemDrag(target?.tabId ?? null);
            }
            cleanupDragListeners();
          };
          const handlePointerCancel = () => {
            cancelItemDrag();
            cleanupDragListeners();
          };
          const cleanupDragListeners = () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerCancel);
          };

          window.addEventListener("pointermove", handlePointerMove);
          window.addEventListener("pointerup", handlePointerUp);
          window.addEventListener("pointercancel", handlePointerCancel);

          const updatePointerDragTarget = (target: PointerDragTarget) => {
            if (target?.kind === "item") {
              setItemDropTarget(target);
              setDropTargetTabId(null);
            } else {
              setItemDropTarget(null);
              setDropTargetTabId(target?.tabId ?? null);
            }
          };
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
      {cursorRect ? (
        <span
          className={editorMode === "visual" ? "vim-block-cursor visual" : "vim-block-cursor"}
          style={{ height: cursorRect.height, left: cursorRect.left, top: cursorRect.top }}
        />
      ) : null}
      {slashState && slashItems.length > 0 ? (
        <SlashMenu
          items={slashItems}
          position={slashState.position}
          selectedIndex={Math.min(slashState.selectedIndex, slashItems.length - 1)}
          onDismiss={() => dismissSlashMenu(editor, slashState.range, setSlashState)}
          onSelect={(command) => applySlashCommand(editor, slashState, command, setLinkPopup, setSlashState)}
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

function rowClassName(focused: boolean, selected: boolean, dropPosition: "before" | "after" | null) {
  return [
    "item-row",
    focused ? "focused" : "",
    selected ? "selected" : "",
    dropPosition ? `drop-${dropPosition}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getPointerDragTarget(x: number, y: number): PointerDragTarget {
  const target = document.elementFromPoint(x, y);

  if (!(target instanceof HTMLElement)) {
    return null;
  }

  const item = target.closest<HTMLElement>("[data-item-id][data-tab-id]");

  if (item) {
    const rect = item.getBoundingClientRect();
    return {
      kind: "item",
      itemId: item.dataset.itemId ?? "",
      position: y < rect.top + rect.height / 2 ? "before" : "after",
      tabId: item.dataset.tabId ?? "",
    };
  }

  const tab = target.closest<HTMLElement>(".tab-bar [data-tab-id]");
  return tab?.dataset.tabId ? { kind: "tab", tabId: tab.dataset.tabId } : null;
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
  setSlashState: (state: SlashState | null) => void,
) {
  if (!editor) {
    return;
  }

  const chain = editor.chain().focus().deleteRange(slashState.range);

  if (command === "link") {
    chain.run();
    setLinkPopup({ position: slashState.position });
    setSlashState(null);
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
