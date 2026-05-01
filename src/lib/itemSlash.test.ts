import type { Editor } from "@tiptap/core";
import { describe, expect, it, vi } from "vitest";
import { appendAfterTask, handleSlashKey, insertLink, type SlashState } from "./itemSlash";

describe("item slash helpers", () => {
  it("inserts a hyperlink and clears the active link mark", () => {
    const editor = createEditorDouble();

    insertLink(editor, "Nota", "nota.local");

    expect(editor.chainApi.insertContent).toHaveBeenCalledWith({
      type: "text",
      text: "Nota",
      marks: [{ type: "link", attrs: { href: "https://nota.local" } }],
    });
    expect(editor.chainApi.unsetMark).toHaveBeenCalledWith("link");
    expect(editor.commands.setTextSelection).toHaveBeenCalledWith(8);
    expect(editor.commands.unsetMark).toHaveBeenCalledWith("link");
  });

  it("appends after the task without extending an existing link", () => {
    const editor = createEditorDouble();

    appendAfterTask(editor);

    expect(editor.chainApi.setTextSelection).toHaveBeenCalledWith(12);
    expect(editor.chainApi.unsetMark).toHaveBeenCalledWith("link");
  });

  it("lets j and k type while slash suggestions are open", () => {
    const event = createKeyboardEvent("j");
    const handled = handleSlashKey(event, createSlashState(), [], vi.fn(), vi.fn());

    expect(handled).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("does not reserve arrow keys for slash suggestions", () => {
    const event = createKeyboardEvent("ArrowDown");
    const handled = handleSlashKey(
      event,
      createSlashState(),
      [{ id: "link", kind: "command", command: "link", label: "Link", description: "Add link" }],
      vi.fn(),
      vi.fn(),
    );

    expect(handled).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

function createSlashState(): SlashState {
  return {
    query: "",
    range: { from: 1, to: 2 },
    selectedIndex: 0,
    position: { left: 0, top: 0 },
  };
}

function createKeyboardEvent(key: string) {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent;
}

function createEditorDouble() {
  const chainApi = {
    focus: vi.fn(() => chainApi),
    insertContent: vi.fn(() => chainApi),
    setTextSelection: vi.fn(() => chainApi),
    unsetMark: vi.fn(() => chainApi),
    run: vi.fn(() => true),
  };
  const editor = {
    chain: vi.fn(() => chainApi),
    commands: {
      setTextSelection: vi.fn(),
      unsetMark: vi.fn(),
    },
    state: {
      selection: {
        to: 8,
        $from: {
          end: vi.fn(() => 12),
        },
      },
    },
    chainApi,
  };

  return editor as unknown as Editor & { chainApi: typeof chainApi };
}
