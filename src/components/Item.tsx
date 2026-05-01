import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import type { Item as ItemModel } from "../lib/types";
import { useNotesStore } from "../store/notes";

type ItemProps = {
  item: ItemModel;
  focused: boolean;
  index: number;
  tabId: string;
};

export function Item({ focused, index, item, tabId }: ItemProps) {
  const mode = useNotesStore((state) => state.mode);
  const setCursorIndex = useNotesStore((state) => state.setCursorIndex);
  const setMode = useNotesStore((state) => state.setMode);
  const checkItem = useNotesStore((state) => state.checkItem);
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
      className={focused ? "item-row focused" : "item-row"}
      data-state={item.state}
      onClick={() => {
        setCursorIndex(index);
        setMode("edit");
      }}
    >
      <span className="item-check" aria-hidden="true" />
      <EditorContent editor={editor} />
    </article>
  );
}
