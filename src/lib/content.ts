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

export function extractFirstLink(content: JSONContent): string | null {
  const href = content.marks?.find((mark) => mark.type === "link" && typeof mark.attrs?.href === "string")?.attrs
    ?.href;

  if (href) {
    return href;
  }

  if (!Array.isArray(content.content)) {
    return null;
  }

  for (const child of content.content) {
    const childHref = extractFirstLink(child);
    if (childHref) {
      return childHref;
    }
  }

  return null;
}
