import { useEffect, useMemo, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { GripVertical, X } from "lucide-react";
import {
  applySlashItem,
  dismissSlashMenu,
  handleSlashKey,
  insertLink,
  readSlashState,
  type LinkPopupState,
  type SlashState,
} from "../lib/itemSlash";
import { handleEditorModeKey, type ItemEditorMode } from "../lib/itemEditorVim";
import { buildSlashItems } from "../lib/slashCommands";
import { collectActiveTags } from "../lib/tags";
import type { Item as ItemModel } from "../lib/types";
import { useNotesStore } from "../store/notes";
import { LinkPopup } from "./LinkPopup";
import { SlashMenu } from "./SlashMenu";

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
  const addItemTag = useNotesStore((state) => state.addItemTag);
  const removeItemTag = useNotesStore((state) => state.removeItemTag);
  const finishItemDrag = useNotesStore((state) => state.finishItemDrag);
  const finishItemDragAtItem = useNotesStore((state) => state.finishItemDragAtItem);
  const setSelectedItemIds = useNotesStore((state) => state.setSelectedItemIds);
  const setItemDropTarget = useNotesStore((state) => state.setItemDropTarget);
  const setDropTargetTabId = useNotesStore((state) => state.setDropTargetTabId);
  const startItemDrag = useNotesStore((state) => state.startItemDrag);
  const toggleItemSelection = useNotesStore((state) => state.toggleItemSelection);
  const updateItemContent = useNotesStore((state) => state.updateItemContent);
  const tabs = useNotesStore((state) => state.tabs);
  const [editorMode, setEditorMode] = useState<ItemEditorMode>("insert");
  const [cursorRect, setCursorRect] = useState<CursorRect | null>(null);
  const [slashState, setSlashState] = useState<SlashState | null>(null);
  const [linkPopup, setLinkPopup] = useState<LinkPopupState | null>(null);
  const activeTags = useMemo(() => collectActiveTags(tabs), [tabs]);
  const slashItems = useMemo(
    () => buildSlashItems(slashState?.query ?? "", activeTags, item.tags ?? []),
    [activeTags, item.tags, slashState?.query],
  );
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
            applySlashItem(editor, slashState, command, (tagName) => addItemTag(tabId, item.id, tagName), setLinkPopup, setSlashState);
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
    if (focused) {
      rowRef.current?.scrollIntoView({ block: "nearest" });
    }
  }, [focused]);

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
          left: coords.left - rowRect.left - 3,
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
      <div className="item-body">
        <EditorContent editor={editor} />
        {(item.tags ?? []).length > 0 ? (
          <div className="item-tags" aria-label="Tags">
            {(item.tags ?? []).map((tag) => (
              <span className="item-tag" key={tag.name} style={{ borderColor: tag.color, color: tag.color }}>
                {tag.name}
                <button
                  type="button"
                  aria-label={`Remove ${tag.name} tag`}
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItemTag(tabId, item.id, tag.name);
                  }}
                >
                  <X size={10} strokeWidth={2} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>
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
          onSelect={(command) =>
            applySlashItem(editor, slashState, command, (tagName) => addItemTag(tabId, item.id, tagName), setLinkPopup, setSlashState)
          }
        />
      ) : null}
      {linkPopup ? (
        <LinkPopup
          position={linkPopup.position}
          onCancel={() => setLinkPopup(null)}
          onSubmit={(label, url) => {
            insertLink(editor, label, url);
            setLinkPopup(null);
            setEditorMode("normal");
            editor?.commands.focus();
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
