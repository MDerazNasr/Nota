import type { Editor } from "@tiptap/core";
import { appendAfterTask } from "./itemSlash";
import {
  changeInnerWord,
  deleteAroundPair,
  deleteInsidePair,
  deleteUnderCursor,
  pasteAfterCursor,
  yankCurrentLine,
} from "./itemEditorVimOperators";
import {
  jumpToBoundary,
  jumpToDocumentEdge,
  jumpToMatchingBracket,
  moveByCharacter,
  moveByWord,
  searchInTask,
  selectCurrentCharacter,
  selectWholeTask,
} from "./itemEditorVimMotions";
import type { ItemEditorVimState } from "./itemEditorVimState";
import { recordCommandKey, resetVimState } from "./itemEditorVimState";

export type ItemEditorMode = "insert" | "normal" | "visual" | "visual-line";

export function createItemEditorVimState(): ItemEditorVimState {
  return {
    clipboard: null,
    commandBuffer: "",
    lastSearch: null,
    pendingExCommand: null,
    pendingSearch: null,
  };
}

export function handleEditorModeKey(
  event: KeyboardEvent,
  editor: Editor | null,
  editorMode: ItemEditorMode,
  setEditorMode: (mode: ItemEditorMode) => void,
  exitEditor: () => void,
  vimState: ItemEditorVimState,
) {
  if (!editor) {
    return false;
  }

  if ((event.metaKey || event.ctrlKey) && ["b", "i", "u"].includes(event.key.toLowerCase())) {
    return false;
  }

  if (editorMode === "insert") {
    return handleInsertMode(event, setEditorMode, vimState);
  }

  if (handleSearchInput(event, editor, vimState)) {
    return true;
  }

  if (handleExCommandInput(event, editor, vimState)) {
    return true;
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "r") {
    event.preventDefault();
    editor.chain().focus().redo().run();
    resetVimState(vimState);
    return true;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    if (editorMode === "visual" || editorMode === "visual-line") {
      editor.commands.setTextSelection(editor.state.selection.to);
      setEditorMode("normal");
    } else {
      exitEditor();
    }
    resetVimState(vimState);
    return true;
  }

  if (handleArrowMotion(event, editor, editorMode)) {
    resetVimState(vimState);
    return true;
  }

  if (handleImmediateModeKey(event, editor, editorMode, setEditorMode, vimState)) {
    return true;
  }

  if (handleBufferedCommand(event, editor, editorMode, setEditorMode, vimState)) {
    return true;
  }

  if (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete" || event.key === "Enter") {
    event.preventDefault();
    return true;
  }

  return false;
}

function handleInsertMode(
  event: KeyboardEvent,
  setEditorMode: (mode: ItemEditorMode) => void,
  vimState: ItemEditorVimState,
) {
  if (event.key === "Escape") {
    event.preventDefault();
    setEditorMode("normal");
    resetVimState(vimState);
    return true;
  }

  return false;
}

function handleSearchInput(event: KeyboardEvent, editor: Editor, vimState: ItemEditorVimState) {
  if (vimState.pendingSearch === null) {
    return false;
  }

  event.preventDefault();

  if (event.key === "Escape") {
    vimState.pendingSearch = null;
    vimState.commandBuffer = "";
    return true;
  }

  if (event.key === "Backspace") {
    vimState.pendingSearch = vimState.pendingSearch.slice(0, -1);
    return true;
  }

  if (event.key === "Enter") {
    searchInTask(editor, vimState.pendingSearch, "next");
    vimState.lastSearch = vimState.pendingSearch;
    vimState.pendingSearch = null;
    vimState.commandBuffer = "";
    return true;
  }

  if (event.key.length === 1) {
    vimState.pendingSearch += event.key;
  }

  return true;
}

function handleImmediateModeKey(
  event: KeyboardEvent,
  editor: Editor,
  editorMode: ItemEditorMode,
  setEditorMode: (mode: ItemEditorMode) => void,
  vimState: ItemEditorVimState,
) {
  if (event.key === "i") {
    event.preventDefault();
    editor.chain().focus().run();
    setEditorMode("insert");
    resetVimState(vimState);
    return true;
  }

  if (event.key === "a") {
    event.preventDefault();
    moveByCharacter(editor, "normal", 1);
    editor.chain().focus().run();
    setEditorMode("insert");
    resetVimState(vimState);
    return true;
  }

  if (event.key === "I") {
    event.preventDefault();
    jumpToBoundary(editor, "start", "normal");
    editor.chain().focus().run();
    setEditorMode("insert");
    resetVimState(vimState);
    return true;
  }

  if (event.key === "A") {
    event.preventDefault();
    appendAfterTask(editor);
    setEditorMode("insert");
    resetVimState(vimState);
    return true;
  }

  if (event.key === "v") {
    event.preventDefault();
    if (editorMode === "visual") {
      setEditorMode("normal");
    } else {
      selectCurrentCharacter(editor);
      setEditorMode("visual");
    }
    resetVimState(vimState);
    return true;
  }

  if (event.key === "V") {
    event.preventDefault();
    selectWholeTask(editor);
    setEditorMode("visual-line");
    resetVimState(vimState);
    return true;
  }

  return false;
}

function handleArrowMotion(event: KeyboardEvent, editor: Editor, editorMode: ItemEditorMode) {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    moveByCharacter(editor, editorMode, -1);
    return true;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    moveByCharacter(editor, editorMode, 1);
    return true;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    jumpToBoundary(editor, "start", editorMode);
    return true;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    jumpToBoundary(editor, "end", editorMode);
    return true;
  }

  return false;
}

function handleBufferedCommand(
  event: KeyboardEvent,
  editor: Editor,
  editorMode: ItemEditorMode,
  setEditorMode: (mode: ItemEditorMode) => void,
  vimState: ItemEditorVimState,
) {
  const command = recordCommandKey(vimState, event.key);

  if (!command) {
    return false;
  }

  event.preventDefault();

  if (isCommandPrefix(command)) {
    return true;
  }

  const handled = runCommand(command, editor, editorMode, setEditorMode, vimState);

  if (!handled) {
    resetVimState(vimState);
  }

  return true;
}

function runCommand(
  command: string,
  editor: Editor,
  editorMode: ItemEditorMode,
  setEditorMode: (mode: ItemEditorMode) => void,
  vimState: ItemEditorVimState,
) {
  if (command === "u") {
    editor.chain().focus().undo().run();
    resetVimState(vimState);
    return true;
  }

  if (command === "h" || command === "Backspace") {
    moveByCharacter(editor, editorMode, -1);
  } else if (command === "l" || command === " ") {
    moveByCharacter(editor, editorMode, 1);
  } else if (command === "j") {
    jumpToBoundary(editor, "end", editorMode);
  } else if (command === "k") {
    jumpToBoundary(editor, "start", editorMode);
  } else if (command === "w" || command === "W") {
    moveByWord(editor, editorMode, "next-start", command === "W");
  } else if (command === "b" || command === "B") {
    moveByWord(editor, editorMode, "previous-start", command === "B");
  } else if (command === "0") {
    jumpToBoundary(editor, "start", editorMode);
  } else if (command === "$") {
    jumpToBoundary(editor, "end", editorMode);
  } else if (command === "gg") {
    jumpToDocumentEdge(editor, "start", editorMode);
  } else if (command === "G") {
    jumpToDocumentEdge(editor, "end", editorMode);
  } else if (command === "%") {
    jumpToMatchingBracket(editor, editorMode);
  } else if (command === "/") {
    vimState.pendingSearch = "";
    return true;
  } else if (command === ":") {
    vimState.pendingExCommand = "";
    return true;
  } else if (command === "n" || command === "N") {
    searchInTask(editor, vimState.lastSearch, command === "n" ? "next" : "previous");
  } else if (command === "x" || command === "Delete") {
    deleteUnderCursor(editor);
  } else if (command === "yy") {
    vimState.clipboard = yankCurrentLine(editor);
  } else if (command === "p") {
    pasteAfterCursor(editor, vimState.clipboard);
  } else if (command === "dd") {
    vimState.clipboard = yankCurrentLine(editor);
    editor.commands.clearContent();
  } else if (command === "ciw" || command === "ciW") {
    changeInnerWord(editor, command === "ciW");
    setEditorMode("insert");
  } else if (command === "di(") {
    deleteInsidePair(editor, "(", ")");
  } else if (command === "da(") {
    deleteAroundPair(editor, "(", ")");
  } else if (command === "cit") {
    changeHtmlTag(editor);
    setEditorMode("insert");
  } else {
    return false;
  }

  resetVimState(vimState);
  return true;
}

function handleExCommandInput(event: KeyboardEvent, editor: Editor, vimState: ItemEditorVimState) {
  if (vimState.pendingExCommand === null) {
    return false;
  }

  event.preventDefault();

  if (event.key === "Escape") {
    vimState.pendingExCommand = null;
    vimState.commandBuffer = "";
    return true;
  }

  if (event.key === "Backspace") {
    vimState.pendingExCommand = vimState.pendingExCommand.slice(0, -1);
    return true;
  }

  if (event.key === "Enter") {
    runExCommand(editor, vimState.pendingExCommand);
    vimState.pendingExCommand = null;
    vimState.commandBuffer = "";
    return true;
  }

  if (event.key.length === 1) {
    vimState.pendingExCommand += event.key;
  }

  return true;
}

function runExCommand(editor: Editor, command: string) {
  const replace = /^%s\/(.+)\/(.*)\/(g|gc)$/.exec(command);

  if (!replace) {
    return;
  }

  const [, oldText, newText, flags] = replace;
  const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\ufffc");
  let nextText = "";
  let cursor = 0;

  for (let index = text.indexOf(oldText); index >= 0; index = text.indexOf(oldText, cursor)) {
    nextText += text.slice(cursor, index);
    const confirmed = flags === "g" || window.confirm(`Replace "${oldText}" with "${newText}"?`);
    nextText += confirmed ? newText : oldText;
    cursor = index + oldText.length;
  }

  nextText += text.slice(cursor);

  if (nextText !== text) {
    editor.commands.setContent({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: nextText }] }] });
  }
}

function changeHtmlTag(editor: Editor) {
  const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n", "\ufffc");
  const selectionOffset = editor.state.selection.from - 1;
  const openStart = text.lastIndexOf("<", selectionOffset);
  const openEnd = openStart >= 0 ? text.indexOf(">", openStart) : -1;

  if (openStart < 0 || openEnd < selectionOffset) {
    return;
  }

  const tagName = /^<\s*([A-Za-z][\w:-]*)\b/.exec(text.slice(openStart, openEnd + 1))?.[1];
  const closeStart = tagName ? text.indexOf(`</${tagName}>`, selectionOffset) : -1;

  if (!tagName || closeStart < 0) {
    return;
  }

  editor.commands.deleteRange({ from: openEnd + 2, to: closeStart + 1 });
}

function isCommandPrefix(command: string) {
  return ["g", "y", "d", "c", "ci", "di", "da"].includes(command);
}
