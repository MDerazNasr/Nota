import type { Editor } from "@tiptap/core";
import { findWordBoundary } from "./itemEditorVimMotions";

export function deleteUnderCursor(editor: Editor) {
  const selection = editor.state.selection;

  if (!selection.empty) {
    editor.commands.deleteSelection();
    return;
  }

  const from = selection.from;
  const to = Math.min(from + 1, editor.state.doc.content.size);

  if (from !== to) {
    editor.commands.deleteRange({ from, to });
  }
}

export function yankCurrentLine(editor: Editor) {
  return editor.state.selection.$from.parent.textBetween(0, editor.state.selection.$from.parent.content.size, "\n", "\ufffc");
}

export function pasteAfterCursor(editor: Editor, clipboard: string | null) {
  if (!clipboard) {
    return;
  }

  editor.chain().focus().insertContent(` ${clipboard}`).run();
}

export function changeInnerWord(editor: Editor, bigWord: boolean) {
  const range = wordRange(editor, bigWord);

  if (range) {
    editor.commands.deleteRange(range);
  }
}

export function deleteInsidePair(editor: Editor, open: string, close: string) {
  const range = pairRange(editor, open, close, false);

  if (range) {
    editor.commands.deleteRange(range);
  }
}

export function deleteAroundPair(editor: Editor, open: string, close: string) {
  const range = pairRange(editor, open, close, true);

  if (range) {
    editor.commands.deleteRange(range);
  }
}

function wordRange(editor: Editor, bigWord: boolean) {
  const { $from } = editor.state.selection;
  const text = $from.parent.textBetween(0, $from.parent.content.size, undefined, "\ufffc");
  const start = findWordBoundary(text, $from.parentOffset, -1, bigWord);
  const end = findWordBoundary(text, $from.parentOffset, 1, bigWord);

  if (start === end) {
    return null;
  }

  return { from: $from.start() + start, to: $from.start() + end };
}

function pairRange(editor: Editor, open: string, close: string, includePair: boolean) {
  const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\ufffc");
  const cursor = editor.state.selection.from - 1;
  const openIndex = text.lastIndexOf(open, cursor);
  const closeIndex = text.indexOf(close, cursor);

  if (openIndex < 0 || closeIndex < 0 || closeIndex <= openIndex) {
    return null;
  }

  return includePair
    ? { from: openIndex + 1, to: closeIndex + 2 }
    : { from: openIndex + 2, to: closeIndex + 1 };
}
