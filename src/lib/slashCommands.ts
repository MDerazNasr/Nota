import type { SlashCommand } from "../components/SlashMenu";

export const SLASH_COMMANDS: SlashCommand[] = ["link"];

export function filterSlashCommands(query: string) {
  const normalized = query.toLowerCase();
  return SLASH_COMMANDS.filter((command) => command.startsWith(normalized));
}

export function nextSlashIndex(current: number, direction: "up" | "down", length: number) {
  if (length === 0) {
    return 0;
  }

  const offset = direction === "down" ? 1 : -1;
  return (current + offset + length) % length;
}
