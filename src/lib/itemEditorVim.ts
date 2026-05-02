import type { Editor } from "@tiptap/core";

export type ItemEditorMode = "insert" | "normal" | "visual";

export function handleEditorModeKey(
  event: KeyboardEvent,
  editor: Editor | null,
  editorMode: ItemEditorMode,
  setEditorMode: (mode: ItemEditorMode) => void,
  exitEditor: () => void,
) {
  if (!editor) {
    return false;
  }

  if ((event.metaKey || event.ctrlKey) && ["b", "i", "u"].includes(event.key.toLowerCase())) {
    return false;
  }

  if (editorMode === "insert") {
    if (event.key === "Escape") {
      event.preventDefault();
      setEditorMode("normal");
      return true;
    }

    return false;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    if (editorMode === "visual") {
      editor.commands.setTextSelection(editor.state.selection.to);
      setEditorMode("normal");
    } else {
      exitEditor();
    }
    return true;
  }

  if (event.key === "i") {
    event.preventDefault();
    editor.chain().focus().run();
    setEditorMode("insert");
    return true;
  }

  if (event.key === "v") {
    event.preventDefault();
    selectCurrentWord(editor);
    setEditorMode("visual");
    return true;
  }

  if (event.key === "h" || event.key === "ArrowLeft") {
    event.preventDefault();
    moveEditorSelection(editor, editorMode, -1);
    return true;
  }

  if (event.key === "l" || event.key === "ArrowRight") {
    event.preventDefault();
    moveEditorSelection(editor, editorMode, 1);
    return true;
  }

  if (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete" || event.key === "Enter") {
    event.preventDefault();
    return true;
  }

  return false;
}

function moveEditorSelection(editor: Editor, editorMode: ItemEditorMode, offset: -1 | 1) {
  const selection = editor.state.selection;
  const max = editor.state.doc.content.size;

  if (editorMode === "visual") {
    const anchor = selection.anchor;
    const nextHead = clampPosition(selection.head + offset, 1, max);
    editor.commands.setTextSelection({ from: anchor, to: nextHead });
    return;
  }

  const nextPosition = clampPosition(selection.to + offset, 1, max);
  editor.commands.setTextSelection(nextPosition);
}

function selectCurrentWord(editor: Editor) {
  const { $from } = editor.state.selection;
  const text = $from.parent.textBetween(0, $from.parent.content.size, undefined, "\ufffc");
  const offset = $from.parentOffset;
  const start = findWordBoundary(text, offset, -1);
  const end = findWordBoundary(text, offset, 1);

  if (start === end) {
    return;
  }

  editor.commands.setTextSelection({ from: $from.start() + start, to: $from.start() + end });
}

function findWordBoundary(text: string, offset: number, direction: -1 | 1) {
  let index = offset;

  while (index > 0 && direction === -1 && /\w/.test(text[index - 1] ?? "")) {
    index -= 1;
  }

  while (index < text.length && direction === 1 && /\w/.test(text[index] ?? "")) {
    index += 1;
  }

  return index;
}

function clampPosition(position: number, min: number, max: number) {
  return Math.min(Math.max(position, min), max);
}
