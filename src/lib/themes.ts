export type ThemeDefinition = {
  name: string;
  variables: Record<string, string>;
};

export const THEMES: Record<string, ThemeDefinition> = {
  "dark-zinc": {
    name: "Dark",
    variables: {
      "--bg": "#09090b",
      "--surface": "#18181b",
      "--surface-hover": "#27272a",
      "--border": "#3f3f46",
      "--text-primary": "#f4f4f5",
      "--text-secondary": "#a1a1aa",
      "--text-muted": "#71717a",
      "--accent": "#4F8EF7",
      "--accent-muted": "rgb(79 142 247 / 30%)",
      "--done-opacity": "0.45",
    },
  },
  light: {
    name: "Light",
    variables: {
      "--bg": "#ffffff",
      "--surface": "#f8fafc",
      "--surface-hover": "#e2e8f0",
      "--border": "#cbd5e1",
      "--text-primary": "#0f172a",
      "--text-secondary": "#475569",
      "--text-muted": "#64748b",
      "--accent": "#2563EB",
      "--accent-muted": "rgb(37 99 235 / 30%)",
      "--done-opacity": "0.45",
    },
  },
  "catppuccin-mocha": {
    name: "Catppuccin Mocha",
    variables: {
      "--bg": "#1e1e2e",
      "--surface": "#313244",
      "--surface-hover": "#45475a",
      "--border": "#585b70",
      "--text-primary": "#cdd6f4",
      "--text-secondary": "#bac2de",
      "--text-muted": "#7f849c",
      "--accent": "#cba6f7",
      "--accent-muted": "rgb(203 166 247 / 30%)",
      "--done-opacity": "0.45",
    },
  },
  dracula: {
    name: "Dracula",
    variables: {
      "--bg": "#282a36",
      "--surface": "#44475a",
      "--surface-hover": "#565a72",
      "--border": "#6272a4",
      "--text-primary": "#f8f8f2",
      "--text-secondary": "#d7d7d0",
      "--text-muted": "#a4a5b5",
      "--accent": "#bd93f9",
      "--accent-muted": "rgb(189 147 249 / 30%)",
      "--done-opacity": "0.45",
    },
  },
  "rose-pine": {
    name: "Rose Pine",
    variables: {
      "--bg": "#191724",
      "--surface": "#1f1d2e",
      "--surface-hover": "#26233a",
      "--border": "#403d52",
      "--text-primary": "#e0def4",
      "--text-secondary": "#908caa",
      "--text-muted": "#6e6a86",
      "--accent": "#ebbcba",
      "--accent-muted": "rgb(235 188 186 / 30%)",
      "--done-opacity": "0.45",
    },
  },
};

export function applyTheme(themeKey: string) {
  const theme = THEMES[themeKey] ?? THEMES["dark-zinc"];
  const root = document.documentElement;

  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
