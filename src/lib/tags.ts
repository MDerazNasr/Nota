import type { ItemTag, Tab } from "./types";

const TAG_COLORS = [
  "#4f8ef7",
  "#14b8a6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
];

export function normalizeTagName(name: string) {
  return name.trim().replace(/^\/+/, "").trim().replace(/\s+/g, " ");
}

export function tagKey(name: string) {
  return normalizeTagName(name).toLowerCase();
}

export function createTag(name: string): ItemTag {
  return {
    name: normalizeTagName(name),
    color: TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)],
  };
}

export function collectActiveTags(tabs: Tab[]) {
  const tags = new Map<string, ItemTag>();

  for (const tab of tabs) {
    for (const item of tab.items) {
      for (const tag of item.tags ?? []) {
        const key = tagKey(tag.name);

        if (key && !tags.has(key)) {
          tags.set(key, tag);
        }
      }
    }
  }

  return [...tags.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export function findTagByName(tags: ItemTag[], name: string) {
  const key = tagKey(name);
  return tags.find((tag) => tagKey(tag.name) === key);
}
