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
  "tokyo-night": {
    name: "Tokyo Night",
    variables: {
      "--bg": "#16161e",
      "--surface": "#1f2335",
      "--surface-hover": "#292e42",
      "--border": "#3b4261",
      "--text-primary": "#c0caf5",
      "--text-secondary": "#a9b1d6",
      "--text-muted": "#565f89",
      "--accent": "#7aa2f7",
      "--accent-muted": "rgb(122 162 247 / 30%)",
      "--done-opacity": "0.45",
    },
  },
  "solarized-dark": {
    name: "Solarized Dark",
    variables: {
      "--bg": "#002b36",
      "--surface": "#073642",
      "--surface-hover": "#0b4654",
      "--border": "#586e75",
      "--text-primary": "#fdf6e3",
      "--text-secondary": "#93a1a1",
      "--text-muted": "#657b83",
      "--accent": "#2aa198",
      "--accent-muted": "rgb(42 161 152 / 30%)",
      "--done-opacity": "0.45",
    },
  },
  "gruvbox-dark": {
    name: "Gruvbox Dark",
    variables: {
      "--bg": "#1d2021",
      "--surface": "#282828",
      "--surface-hover": "#3c3836",
      "--border": "#504945",
      "--text-primary": "#ebdbb2",
      "--text-secondary": "#d5c4a1",
      "--text-muted": "#928374",
      "--accent": "#83a598",
      "--accent-muted": "rgb(131 165 152 / 30%)",
      "--done-opacity": "0.45",
    },
  },
  "everforest-dark": {
    name: "Everforest Dark",
    variables: {
      "--bg": "#1e2326",
      "--surface": "#272e33",
      "--surface-hover": "#343f44",
      "--border": "#4f5b58",
      "--text-primary": "#d3c6aa",
      "--text-secondary": "#a7c080",
      "--text-muted": "#859289",
      "--accent": "#a7c080",
      "--accent-muted": "rgb(167 192 128 / 30%)",
      "--done-opacity": "0.45",
    },
  },
  "nord-dark": {
    name: "Nord",
    variables: {
      "--bg": "#2e3440",
      "--surface": "#3b4252",
      "--surface-hover": "#434c5e",
      "--border": "#4c566a",
      "--text-primary": "#eceff4",
      "--text-secondary": "#d8dee9",
      "--text-muted": "#81a1c1",
      "--accent": "#88c0d0",
      "--accent-muted": "rgb(136 192 208 / 30%)",
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
