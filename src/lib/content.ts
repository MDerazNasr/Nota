import type { JSONContent } from "@tiptap/core";

export function extractText(content: JSONContent): string {
  if (typeof content.text === "string") {
    return content.text;
  }

  if (!Array.isArray(content.content)) {
    return "";
  }

  return content.content.map(extractText).join("");
}
