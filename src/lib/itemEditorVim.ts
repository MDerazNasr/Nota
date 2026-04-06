import type { Editor } from "@tiptap/core";
import { appendAfterTask } from "./itemSlash";

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

  if (event.key === "a") {
    event.preventDefault();
    moveEditorSelection(editor, "normal", 1);
    editor.chain().focus().run();
    setEditorMode("insert");
    return true;
  }

  if (event.key === "I") {
    event.preventDefault();
    moveToLineBoundary(editor, "start", "normal");
    editor.chain().focus().run();
    setEditorMode("insert");
    return true;
  }

  if (event.key === "A") {
    event.preventDefault();
    appendAfterTask(editor);
    setEditorMode("insert");
    return true;
  }

  if (event.key === "v") {
    event.preventDefault();
    if (editorMode === "visual") {
      setEditorMode("normal");
    } else {
      selectCurrentWord(editor);
      setEditorMode("visual");
    }
    return true;
  }

  if (event.key === "V") {
    event.preventDefault();
    selectWholeTask(editor);
    setEditorMode("visual");
    return true;
  }

  if (event.key === "h" || event.key === "ArrowLeft" || event.key === "Backspace") {
    event.preventDefault();
    moveEditorSelection(editor, editorMode, -1);
    return true;
  }

  if (event.key === "l" || event.key === "ArrowRight" || event.key === " ") {
    event.preventDefault();
    moveEditorSelection(editor, editorMode, 1);
    return true;
  }

  if (event.key === "ArrowUp" || event.key === "k") {
    event.preventDefault();
    moveToLineBoundary(editor, "start", editorMode);
    return true;
  }

  if (event.key === "ArrowDown" || event.key === "j") {
    event.preventDefault();
    moveToLineBoundary(editor, "end", editorMode);
    return true;
  }

  if (event.key === "0" || event.key === "^" || event.key === "Home") {
    event.preventDefault();
    moveToLineBoundary(editor, "start", editorMode);
    return true;
  }

  if (event.key === "$" || event.key === "End") {
    event.preventDefault();
    moveToLineBoundary(editor, "end", editorMode);
    return true;
  }

  if (event.key === "w") {
    event.preventDefault();
    moveByWord(editor, editorMode, "next-start");
    return true;
  }

  if (event.key === "b") {
    event.preventDefault();
    moveByWord(editor, editorMode, "previous-start");
    return true;
  }

  if (event.key === "e") {
    event.preventDefault();
    moveByWord(editor, editorMode, "next-end");
    return true;
  }

  if (event.key === "x" || event.key === "Delete") {
    event.preventDefault();
    deleteUnderCursor(editor);
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

function moveToLineBoundary(editor: Editor, boundary: "start" | "end", editorMode: ItemEditorMode) {
  const selection = editor.state.selection;
  const { $from } = selection;
  const next = boundary === "start" ? $from.start() : $from.end();

  if (editorMode === "visual") {
    editor.commands.setTextSelection({ from: selection.anchor, to: next });
  } else {
    editor.commands.setTextSelection(next);
  }
}

function moveByWord(editor: Editor, editorMode: ItemEditorMode, motion: "next-start" | "previous-start" | "next-end") {
  const selection = editor.state.selection;
  const { $from } = selection;
  const text = $from.parent.textBetween(0, $from.parent.content.size, undefined, "\ufffc");
  const offset = $from.parentOffset;
  const nextOffset =
    motion === "previous-start" ? previousWordStart(text, offset) : motion === "next-end" ? nextWordEnd(text, offset) : nextWordStart(text, offset);
  const nextPosition = clampPosition($from.start() + nextOffset, $from.start(), $from.end());

  if (editorMode === "visual") {
    editor.commands.setTextSelection({ from: selection.anchor, to: nextPosition });
  } else {
    editor.commands.setTextSelection(nextPosition);
  }
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

function selectWholeTask(editor: Editor) {
  const { $from } = editor.state.selection;
  editor.commands.setTextSelection({ from: $from.start(), to: $from.end() });
}

function deleteUnderCursor(editor: Editor) {
  const selection = editor.state.selection;

  if (!selection.empty) {
    editor.commands.deleteSelection();
    return;
  }

  const from = selection.from;
  const to = clampPosition(from + 1, from, editor.state.doc.content.size);

  if (from !== to) {
    editor.commands.deleteRange({ from, to });
  }
}

function nextWordStart(text: string, offset: number) {
  let index = Math.min(offset + 1, text.length);

  while (index < text.length && /\w/.test(text[index] ?? "")) {
    index += 1;
  }

  while (index < text.length && !/\w/.test(text[index] ?? "")) {
    index += 1;
  }

  return index;
}

function previousWordStart(text: string, offset: number) {
  let index = Math.max(offset - 1, 0);

  while (index > 0 && !/\w/.test(text[index] ?? "")) {
    index -= 1;
  }

  while (index > 0 && /\w/.test(text[index - 1] ?? "")) {
    index -= 1;
  }

  return index;
}

function nextWordEnd(text: string, offset: number) {
  let index = Math.min(offset + 1, text.length);

  while (index < text.length && !/\w/.test(text[index] ?? "")) {
    index += 1;
  }

  while (index < text.length && /\w/.test(text[index + 1] ?? "")) {
    index += 1;
  }

  return index;
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
