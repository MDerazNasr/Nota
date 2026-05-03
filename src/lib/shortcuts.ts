export type ShortcutEvent = {
  altKey: boolean;
  code?: string;
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

  parts.push(normalizeKey(event));
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
    .replace(/\bKey([A-Z])\b/g, "$1")
    .split("+")
    .join(" + ");
}

function normalizeKey(event: ShortcutEvent) {
  if (event.altKey && /^Key[A-Z]$/.test(event.code ?? "")) {
    return event.code as string;
  }

  if (event.key === " ") {
    return "Space";
  }

  if (event.key.length === 1) {
    return event.key.toUpperCase();
  }

  return event.key;
}
