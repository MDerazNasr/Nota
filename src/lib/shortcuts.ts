export type ShortcutEvent = {
  altKey: boolean;
  ctrlKey: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
};

export function formatShortcut(event: ShortcutEvent) {
  if (["Alt", "Control", "Meta", "Shift"].includes(event.key)) {
    return "";
  }

  const parts: string[] = [];

  if (event.metaKey || event.ctrlKey) {
    parts.push("CommandOrControl");
  }

  if (event.altKey) {
    parts.push("Alt");
  }

  if (event.shiftKey) {
    parts.push("Shift");
  }

  parts.push(normalizeKey(event.key));
  return parts.join("+");
}

export function displayShortcut(shortcut: string) {
  if (!shortcut) {
    return "Disabled";
  }

  return shortcut
    .split("CommandOrControl")
    .join("Cmd")
    .split("Alt")
    .join("Opt")
    .split("+")
    .join(" + ");
}

function normalizeKey(key: string) {
  if (key === " ") {
    return "Space";
  }

  if (key.length === 1) {
    return key.toUpperCase();
  }

  return key;
}
