import type { Editor } from "@tiptap/core";
import type { ItemEditorMode } from "./itemEditorVim";

type WordMotion = "next-start" | "previous-start";
type Boundary = "start" | "end";

export function moveByCharacter(editor: Editor, mode: ItemEditorMode, offset: -1 | 1) {
  const selection = editor.state.selection;
  const max = editor.state.doc.content.size;

  if (isVisualMode(mode)) {
    editor.commands.setTextSelection({ from: selection.anchor, to: clampPosition(selection.head + offset, 1, max) });
    return;
  }

  editor.commands.setTextSelection(clampPosition(selection.to + offset, 1, max));
}

export function jumpToBoundary(editor: Editor, boundary: Boundary, mode: ItemEditorMode) {
  const selection = editor.state.selection;
  const next = boundary === "start" ? selection.$from.start() : selection.$from.end();
  setMotionSelection(editor, mode, next);
}

export function jumpToDocumentEdge(editor: Editor, edge: Boundary, mode: ItemEditorMode) {
  const next = edge === "start" ? 1 : editor.state.doc.content.size;
  setMotionSelection(editor, mode, next);
}

export function moveByWord(editor: Editor, mode: ItemEditorMode, motion: WordMotion, bigWord: boolean) {
  const selection = editor.state.selection;
  const { $from } = selection;
  const text = $from.parent.textBetween(0, $from.parent.content.size, undefined, "\ufffc");
  const offset = $from.parentOffset;
  const nextOffset = motion === "previous-start" ? previousWordStart(text, offset, bigWord) : nextWordStart(text, offset, bigWord);
  const nextPosition = clampPosition($from.start() + nextOffset, $from.start(), $from.end());
  setMotionSelection(editor, mode, nextPosition);
}

export function selectCurrentCharacter(editor: Editor) {
  const from = editor.state.selection.from;
  const to = clampPosition(from + 1, from, editor.state.doc.content.size);

  editor.commands.setTextSelection({ from, to });
}

export function selectWholeTask(editor: Editor) {
  const { $from } = editor.state.selection;
  editor.commands.setTextSelection({ from: $from.start(), to: $from.end() });
}

export function jumpToMatchingBracket(editor: Editor, mode: ItemEditorMode) {
  const text = fullText(editor);
  const offset = editor.state.selection.from - 1;
  const target = findMatchingBracket(text, offset);

  if (target !== null) {
    setMotionSelection(editor, mode, target + 1);
  }
}

export function searchInTask(editor: Editor, query: string | null, direction: "next" | "previous") {
  if (!query) {
    return;
  }

  const text = fullText(editor);
  const current = Math.max(0, editor.state.selection.to - 1);
  const index =
    direction === "next"
      ? findNextWrapped(text, query, current + 1)
      : findPreviousWrapped(text, query, Math.max(0, current - 1));

  if (index >= 0) {
    editor.commands.setTextSelection({ from: index + 1, to: index + 1 + query.length });
  }
}

function setMotionSelection(editor: Editor, mode: ItemEditorMode, position: number) {
  const next = clampPosition(position, 1, editor.state.doc.content.size);

  if (isVisualMode(mode)) {
    editor.commands.setTextSelection({ from: editor.state.selection.anchor, to: next });
  } else {
    editor.commands.setTextSelection(next);
  }
}

function nextWordStart(text: string, offset: number, bigWord: boolean) {
  let index = Math.min(offset + 1, text.length);

  while (index < text.length && isWordCharacter(text[index] ?? "", bigWord)) {
    index += 1;
  }

  while (index < text.length && !isWordCharacter(text[index] ?? "", bigWord)) {
    index += 1;
  }

  return index;
}

function previousWordStart(text: string, offset: number, bigWord: boolean) {
  let index = Math.max(offset - 1, 0);

  while (index > 0 && !isWordCharacter(text[index] ?? "", bigWord)) {
    index -= 1;
  }

  while (index > 0 && isWordCharacter(text[index - 1] ?? "", bigWord)) {
    index -= 1;
  }

  return index;
}

export function findWordBoundary(text: string, offset: number, direction: -1 | 1, bigWord: boolean) {
  let index = offset;

  while (index > 0 && direction === -1 && isWordCharacter(text[index - 1] ?? "", bigWord)) {
    index -= 1;
  }

  while (index < text.length && direction === 1 && isWordCharacter(text[index] ?? "", bigWord)) {
    index += 1;
  }

  return index;
}

function findMatchingBracket(text: string, offset: number) {
  const pairs: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
  const reversePairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const character = text[offset] ?? "";

  if (pairs[character]) {
    return scanForMatch(text, offset, character, pairs[character], 1);
  }

  if (reversePairs[character]) {
    return scanForMatch(text, offset, character, reversePairs[character], -1);
  }

  return null;
}

function scanForMatch(text: string, offset: number, start: string, end: string, step: 1 | -1) {
  let depth = 0;

  for (let index = offset; index >= 0 && index < text.length; index += step) {
    const character = text[index];

    if (character === start) {
      depth += 1;
    } else if (character === end) {
      depth -= 1;
    }

    if (depth === 0) {
      return index;
    }
  }

  return null;
}

function findNextWrapped(text: string, query: string, from: number) {
  const first = text.indexOf(query, from);
  return first >= 0 ? first : text.indexOf(query, 0);
}

function findPreviousWrapped(text: string, query: string, from: number) {
  const first = text.lastIndexOf(query, from);
  return first >= 0 ? first : text.lastIndexOf(query);
}

function fullText(editor: Editor) {
  return editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\ufffc");
}

function isVisualMode(mode: ItemEditorMode) {
  return mode === "visual" || mode === "visual-line";
}

function isWordCharacter(character: string, bigWord: boolean) {
  return bigWord ? !/\s/.test(character) : /\w/.test(character);
}

function clampPosition(position: number, min: number, max: number) {
  return Math.min(Math.max(position, min), max);
}
