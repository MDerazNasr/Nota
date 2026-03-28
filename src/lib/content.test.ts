import { describe, expect, it } from "vitest";
import { extractFirstLink, extractText } from "./content";

describe("extractText", () => {
  it("extracts nested TipTap text content", () => {
    const text = extractText({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Ship" }, { type: "text", text: " Nota" }],
        },
      ],
    });

    expect(text).toBe("Ship Nota");
  });

  it("returns an empty string for empty documents", () => {
    expect(extractText({ type: "doc", content: [{ type: "paragraph" }] })).toBe("");
  });
});

describe("extractFirstLink", () => {
  it("returns the first link mark href", () => {
    expect(
      extractFirstLink({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Nota", marks: [{ type: "link", attrs: { href: "https://nota.local" } }] }],
          },
        ],
      }),
    ).toBe("https://nota.local");
  });
});
