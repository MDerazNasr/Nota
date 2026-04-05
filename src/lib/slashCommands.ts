import type { ItemTag } from "./types";
import { findTagByName, normalizeTagName, tagKey } from "./tags";

export type SlashCommand = "link";

export type SlashMenuItem =
  | { id: string; kind: "command"; command: SlashCommand; label: string; description: string }
  | { id: string; kind: "tag"; tag: ItemTag; label: string; description: string }
  | { id: string; kind: "create-tag"; name: string; label: string; description: string };

export const SLASH_COMMANDS: SlashCommand[] = ["link"];

export function filterSlashCommands(query: string): SlashCommand[] {
  const normalized = tagKey(query);
  return SLASH_COMMANDS.filter((command) => normalized === "" || command === normalized);
}

export function buildSlashItems(query: string, availableTags: ItemTag[], itemTags: ItemTag[] = []): SlashMenuItem[] {
  const normalizedQuery = normalizeTagName(query);
  const queryKey = tagKey(normalizedQuery);
  const itemTagKeys = new Set(itemTags.map((tag) => tagKey(tag.name)));
  const items: SlashMenuItem[] = filterSlashCommands(normalizedQuery).map((command) => ({
    id: `command:${command}`,
    kind: "command",
    command,
    label: `/${command}`,
    description: "Insert hyperlink",
  }));
  const matchingTags = availableTags.filter((tag) => {
    const key = tagKey(tag.name);
    return !itemTagKeys.has(key) && key.startsWith(queryKey);
  });

  items.push(
    ...matchingTags.map((tag) => ({
      id: `tag:${tagKey(tag.name)}`,
      kind: "tag" as const,
      tag,
      label: tag.name,
      description: "Add tag",
    })),
  );

  const exactExistingTag = findTagByName(availableTags, normalizedQuery);
  const exactCommand = SLASH_COMMANDS.includes(queryKey as SlashCommand);

  if (normalizedQuery && !exactExistingTag && !exactCommand) {
    items.push({
      id: `create-tag:${queryKey}`,
      kind: "create-tag",
      name: normalizedQuery,
      label: normalizedQuery,
      description: "Create tag",
    });
  }

  return items;
}

export function nextSlashIndex(current: number, direction: "up" | "down", length: number) {
  if (length === 0) {
    return 0;
  }

  const offset = direction === "down" ? 1 : -1;
  return (current + offset + length) % length;
}
