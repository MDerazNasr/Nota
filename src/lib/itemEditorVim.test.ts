import type { Editor } from "@tiptap/core";
import { describe, expect, it, vi } from "vitest";
import { createItemEditorVimState, handleEditorModeKey, type ItemEditorMode } from "./itemEditorVim";
import { recordCommandKey } from "./itemEditorVimState";

type EditorDouble = Editor & {
  getText: () => string;
};

function createEditorDouble(initialText: string): EditorDouble {
  let text = initialText;
  const selection = {
    anchor: 1,
    empty: true,
    from: 1,
    head: 1,
    to: 1,
    $from: {
      end: () => text.length + 1,
      parent: {
        content: { size: text.length },
        textBetween: () => text,
      },
      parentOffset: 0,
      start: () => 1,
    },
  };

  function syncSelection(from: number, to = from) {
    selection.from = from;
    selection.to = to;
    selection.anchor = from;
    selection.head = to;
    selection.empty = from === to;
    selection.$from.parentOffset = Math.max(0, from - 1);
  }

  function deleteRange({ from, to }: { from: number; to: number }) {
    text = text.slice(0, Math.max(0, from - 1)) + text.slice(Math.max(0, to - 1));
    syncSelection(Math.min(from, text.length + 1));
  }

  const chain = {
    focus: () => chain,
    insertContent: (content: string) => {
      text = text.slice(0, Math.max(0, selection.to - 1)) + content + text.slice(Math.max(0, selection.to - 1));
      syncSelection(selection.to + content.length);
      return chain;
    },
    redo: vi.fn(() => chain),
    run: vi.fn(() => true),
    undo: vi.fn(() => chain),
  };

  return {
    chain: () => chain,
    commands: {
      clearContent: () => {
        text = "";
        syncSelection(1);
        return true;
      },
      deleteRange: (range: { from: number; to: number }) => {
        deleteRange(range);
        return true;
      },
      deleteSelection: () => {
        deleteRange({ from: selection.from, to: selection.to });
        return true;
      },
      setContent: (content: { content?: Array<{ content?: Array<{ text?: string }> }> }) => {
        text = content.content?.[0]?.content?.[0]?.text ?? "";
        syncSelection(1);
        return true;
      },
      setTextSelection: (value: number | { from: number; to: number }) => {
        if (typeof value === "number") {
          syncSelection(value);
        } else {
          syncSelection(value.from, value.to);
        }

        return true;
      },
    },
    getText: () => text,
    state: {
      doc: {
        content: { size: text.length + 2 },
        textBetween: () => text,
      },
      selection,
    },
  } as unknown as EditorDouble;
}

function press(key: string, editor: Editor, mode: ItemEditorMode, state = createItemEditorVimState()) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
  const setMode = vi.fn();
  const exitEditor = vi.fn();

  handleEditorModeKey(event, editor, mode, setMode, exitEditor, state);

  return { event, exitEditor, setMode, state };
}

function typeCommand(command: string, editor: Editor, state = createItemEditorVimState()) {
  for (const key of command) {
    press(key, editor, "normal", state);
  }

  press("Enter", editor, "normal", state);
  return state;
}

describe("item editor vim", () => {
  it("buffers multi-key normal mode commands", () => {
    const state = createItemEditorVimState();

    expect(recordCommandKey(state, "g")).toBe("g");
    expect(recordCommandKey(state, "g")).toBe("gg");
    expect(recordCommandKey(state, "y")).toBe("y");
    expect(recordCommandKey(state, "y")).toBe("yy");
    expect(recordCommandKey(state, "d")).toBe("d");
    expect(recordCommandKey(state, "d")).toBe("dd");
    expect(recordCommandKey(state, "c")).toBe("c");
    expect(recordCommandKey(state, "i")).toBe("ci");
    expect(recordCommandKey(state, "w")).toBe("ciw");
    expect(recordCommandKey(state, "d")).toBe("d");
    expect(recordCommandKey(state, "a")).toBe("da");
    expect(recordCommandKey(state, "(")).toBe("da(");
    expect(recordCommandKey(state, "c")).toBe("c");
    expect(recordCommandKey(state, "i")).toBe("ci");
    expect(recordCommandKey(state, "t")).toBe("cit");
  });

  it("captures typed characters in search mode and repeats matches", () => {
    const editor = createEditorDouble("task jk task");
    const state = createItemEditorVimState();

    press("/", editor, "normal", state);
    press("j", editor, "normal", state);
    press("k", editor, "normal", state);
    press("Enter", editor, "normal", state);

    expect(state.lastSearch).toBe("jk");
    expect(editor.state.selection.from).toBe(6);

    editor.commands.setTextSelection(1);
    press("n", editor, "normal", state);

    expect(editor.state.selection.from).toBe(6);
  });

  it("replaces every match with the ex substitute command", () => {
    const editor = createEditorDouble("alpha beta alpha");

    typeCommand(":%s/alpha/gamma/g", editor);

    expect(editor.getText()).toBe("gamma beta gamma");
  });

  it("asks before each confirmed substitute match", () => {
    const editor = createEditorDouble("alpha beta alpha");
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(true).mockReturnValueOnce(false);

    typeCommand(":%s/alpha/gamma/gc", editor);

    expect(confirm).toHaveBeenCalledTimes(2);
    expect(editor.getText()).toBe("gamma beta alpha");
  });

  it("supports line yank, paste, delete, and word change commands inside a task", () => {
    const editor = createEditorDouble("alpha beta");
    const state = createItemEditorVimState();

    press("y", editor, "normal", state);
    press("y", editor, "normal", state);
    press("$", editor, "normal", state);
    press("p", editor, "normal", state);

    expect(editor.getText()).toBe("alpha beta alpha beta");

    editor.commands.setTextSelection(8);
    press("c", editor, "normal", state);
    press("i", editor, "normal", state);
    const result = press("w", editor, "normal", state);

    expect(editor.getText()).toBe("alpha  alpha beta");
    expect(result.setMode).toHaveBeenCalledWith("insert");

    press("d", editor, "normal", state);
    press("d", editor, "normal", state);

    expect(editor.getText()).toBe("");
  });
});
