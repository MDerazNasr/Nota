import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { GripVertical } from "lucide-react";
import { createItemDragPayload, ITEM_DRAG_MIME } from "../lib/itemDrag";
import type { Item as ItemModel } from "../lib/types";
import { useNotesStore } from "../store/notes";

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

        return false;
      },
    },
    onFocus: () => setMode("edit"),
    onBlur: () => setMode("nav"),
    onUpdate: ({ editor: activeEditor }) => {
      updateItemContent(tabId, item.id, activeEditor.getJSON());
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
    </article>
  );
}

function rowClassName(focused: boolean, selected: boolean) {
  return ["item-row", focused ? "focused" : "", selected ? "selected" : ""].filter(Boolean).join(" ");
}
