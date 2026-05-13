# Swift Rebuild UI Appendix

This appendix contains exact UI tokens, theme values, fonts, and settings layout details for the native Swift rebuild. Use it with `SWIFT_REBUILD_SPEC.md`.

## Design Tokens

Semantic colors:

- `bg`
- `surface`
- `surfaceHover`
- `border`
- `textPrimary`
- `textSecondary`
- `textMuted`
- `accent`
- `accentMuted`
- `doneOpacity`

Default theme: `dark-zinc`.

Default font: `JetBrains Mono`.

Default font size: `13`.

Default item radius: `8`.

## Theme Values

| Key | Name | bg | surface | hover | border | primary | secondary | muted | accent | accent muted | done |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| dark-zinc | Dark | #09090b | #18181b | #27272a | #3f3f46 | #f4f4f5 | #a1a1aa | #71717a | #4F8EF7 | rgb(79 142 247 / 30%) | 0.45 |
| light | Light | #ffffff | #f8fafc | #e2e8f0 | #cbd5e1 | #0f172a | #475569 | #64748b | #2563EB | rgb(37 99 235 / 30%) | 0.45 |
| paper-trail | Paper Trail | #fbf7ef | #f1eadf | #e6d9c8 | #c9b8a3 | #211f1c | #5b5146 | #8a7b69 | #b45309 | rgb(180 83 9 / 24%) | 0.48 |
| blueprint | Blueprint | #eef6ff | #dbeafe | #bfdbfe | #93c5fd | #10233f | #315b8d | #64748b | #dc2626 | rgb(220 38 38 / 20%) | 0.46 |
| matcha | Matcha | #f4f7ed | #e5ead8 | #d4dec2 | #a8b58e | #1f2a1d | #526641 | #7b856d | #0f766e | rgb(15 118 110 / 22%) | 0.46 |
| lilac-light | Lilac Light | #faf5ff | #f3e8ff | #e9d5ff | #c4b5fd | #2e1065 | #6d28d9 | #8b5cf6 | #db2777 | rgb(219 39 119 / 22%) | 0.46 |
| sunrise | Sunrise | #fff7ed | #ffedd5 | #fed7aa | #fdba74 | #32170c | #9a3412 | #c2410c | #7c3aed | rgb(124 58 237 / 20%) | 0.47 |
| candy-terminal | Candy Terminal | #12071f | #21112f | #321845 | #653780 | #ffe4f3 | #a7f3d0 | #d8b4fe | #fb7185 | rgb(251 113 133 / 28%) | 0.46 |
| acid-graphite | Acid Graphite | #111315 | #1c1f22 | #292d31 | #464d53 | #f2f7f2 | #b5c2b8 | #7f8b83 | #d9f99d | rgb(217 249 157 / 24%) | 0.45 |
| lagoon | Lagoon | #061a1f | #0b2a31 | #123842 | #27616d | #e0fbfc | #98f5e1 | #70a9a1 | #f4d35e | rgb(244 211 94 / 24%) | 0.45 |
| catppuccin-mocha | Catppuccin Mocha | #1e1e2e | #313244 | #45475a | #585b70 | #cdd6f4 | #bac2de | #7f849c | #cba6f7 | rgb(203 166 247 / 30%) | 0.45 |
| dracula | Dracula | #282a36 | #44475a | #565a72 | #6272a4 | #f8f8f2 | #d7d7d0 | #a4a5b5 | #bd93f9 | rgb(189 147 249 / 30%) | 0.45 |
| rose-pine | Rose Pine | #191724 | #1f1d2e | #26233a | #403d52 | #e0def4 | #908caa | #6e6a86 | #ebbcba | rgb(235 188 186 / 30%) | 0.45 |
| tokyo-night | Tokyo Night | #16161e | #1f2335 | #292e42 | #3b4261 | #c0caf5 | #a9b1d6 | #565f89 | #7aa2f7 | rgb(122 162 247 / 30%) | 0.45 |
| solarized-dark | Solarized Dark | #002b36 | #073642 | #0b4654 | #586e75 | #fdf6e3 | #93a1a1 | #657b83 | #2aa198 | rgb(42 161 152 / 30%) | 0.45 |
| gruvbox-dark | Gruvbox Dark | #1d2021 | #282828 | #3c3836 | #504945 | #ebdbb2 | #d5c4a1 | #928374 | #83a598 | rgb(131 165 152 / 30%) | 0.45 |
| everforest-dark | Everforest Dark | #1e2326 | #272e33 | #343f44 | #4f5b58 | #d3c6aa | #a7c080 | #859289 | #a7c080 | rgb(167 192 128 / 30%) | 0.45 |
| nord-dark | Nord | #2e3440 | #3b4252 | #434c5e | #4c566a | #eceff4 | #d8dee9 | #81a1c1 | #88c0d0 | rgb(136 192 208 / 30%) | 0.45 |
| one-dark | One Dark | #1f2329 | #282c34 | #323842 | #4b5263 | #abb2bf | #98c379 | #5c6370 | #61afef | rgb(97 175 239 / 30%) | 0.45 |
| monokai | Monokai | #1b1d1e | #272822 | #3e3d32 | #5b5a4c | #f8f8f2 | #cfcfc2 | #75715e | #a6e22e | rgb(166 226 46 / 28%) | 0.45 |
| kanagawa-wave | Kanagawa | #1f1f28 | #2a2a37 | #363646 | #54546d | #dcd7ba | #c8c093 | #727169 | #7e9cd8 | rgb(126 156 216 / 30%) | 0.45 |
| ayu-dark | Ayu Dark | #0b0e14 | #11151c | #1b2330 | #2d3640 | #bfbdb6 | #e6b673 | #5c6773 | #39bae6 | rgb(57 186 230 / 30%) | 0.45 |
| night-owl | Night Owl | #011627 | #0b2942 | #123653 | #1d3b53 | #d6deeb | #82aaff | #637777 | #addb67 | rgb(173 219 103 / 28%) | 0.45 |
| palenight | Palenight | #292d3e | #30364a | #3a4159 | #676e95 | #eeffff | #c3e88d | #8796b0 | #ffcb6b | rgb(255 203 107 / 28%) | 0.45 |
| github-dark | GitHub Dark | #0d1117 | #161b22 | #21262d | #30363d | #e6edf3 | #8b949e | #6e7681 | #2f81f7 | rgb(47 129 247 / 30%) | 0.45 |
| high-contrast | High Contrast | #000000 | #111111 | #1f1f1f | #5f5f5f | #ffffff | #d4d4d4 | #a3a3a3 | #00e5ff | rgb(0 229 255 / 32%) | 0.5 |

## Fonts

- JetBrains Mono
- SF Mono
- IBM Plex Mono
- Geist Mono
- Fira Code
- Iosevka
- Inconsolata
- Space Mono
- Berkeley Mono

## Tag Colors

New tag colors are randomly selected from this palette:

- `#4f8ef7`
- `#14b8a6`
- `#22c55e`
- `#eab308`
- `#f97316`
- `#ef4444`
- `#ec4899`
- `#8b5cf6`
- `#06b6d4`
- `#84cc16`

## Settings Overlay

- Full app overlay, inset `0`.
- Background surface.
- Slides horizontally over `200ms`.
- Header height `36`, border bottom, padding `0 12`.
- Header title `Settings`, font size `12`, weight `700`.
- Close icon button on the right.
- Tabs: Appearance, Navigation, About.
- Settings tabs use 3 equal columns, gap `4`, padding `12 18 8`.
- Active settings tab has accent border and primary text.
- Settings content padding `12 18 18`.
- Settings content gap `4`.
- Scrollbar is grey using text muted.
- No selector or cursor appears in About.

## Appearance Tab

- Theme row uses a `5` column grid.
- Swatches are `24 x 24`, gap `8`.
- Swatch strips are bg, surface, accent.
- Active swatch has accent border.
- Font select lists all fonts exactly.
- Font Size slider range `10...20`.
- Radius slider range `0...12`.
- Item Limit slider range `5...50`.
- Row min height `40`.
- Row grid columns: label `88`, control `1fr`, reset `28`.
- Row gap `8`, padding `4 8`, bottom border.
- Reset button `24 x 24`, circular.

## Navigation Tab

Behavior toggles:

- Open on startup.
- Show in dock.
- Show in menu bar.

Navigation sections:

- Window
- Tabs
- Item editing
- Item movement
- App navigation
- Slash menu
- Task links
- Task Vim modes
- Task Vim movement
- Task Vim editing
- Task Vim search
- Task tags
- Move mode

Controls:

- Checkboxes are `18 x 18`.
- Editable shortcut rows use a label and capture button.
- Capture button text is `Press keys` while recording.
- Backspace clears a shortcut.
- Escape cancels capture.
- Non-editable rows show shortcut text in a `kbd` style.

## Settings Keyboard

- Settings opens on Appearance with focus index `0`.
- `j/k`: move selector up/down.
- `h/l`: switch settings tabs.
- Enter or Space activates selected row.
- Left/Right adjust selected row where applicable.
- Theme row only: Left/Right cycles horizontally.
- Theme row only: Up/Down moves vertically by 5 swatches.
- Up/Down arrows must not navigate any other settings row.
- Sliders respond to Left/Right.
- Select controls respond to Left/Right and Space/Enter.
- Checkboxes respond to Space/Enter and Left/Right.
- Escape closes settings.
- Shortcut capture blocks settings navigation.
- After changing font, toggles, sliders, or themes, selector remains visible and navigation still works.

## About Tab

- Shows the product copy exactly from the main spec.
- Buttons: Repository and LinkedIn.
- Repository URL: `https://github.com/MDerazNasr/Nota`
- LinkedIn URL: `https://www.linkedin.com/in/mohamed-deraz-nasr-21825b203/`
- No row selector or Vim cursor appears in About.
