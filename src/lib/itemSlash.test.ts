import type { Editor } from "@tiptap/core";
import { describe, expect, it, vi } from "vitest";
import { appendAfterTask, insertLink } from "./itemSlash";

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
});

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
