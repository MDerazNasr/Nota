export const FONT_OPTIONS = [
  "JetBrains Mono",
  "SF Mono",
  "IBM Plex Mono",
  "Geist Mono",
  "Fira Code",
  "Iosevka",
  "Inconsolata",
  "Space Mono",
  "Berkeley Mono",
] as const;

export type FontOption = (typeof FONT_OPTIONS)[number];

export function isFontOption(value: unknown): value is FontOption {
  return typeof value === "string" && FONT_OPTIONS.includes(value as FontOption);
}
