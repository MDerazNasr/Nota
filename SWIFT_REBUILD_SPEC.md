# Swift Rebuild Spec for nota

This is the complete one-file prompt for rebuilding nota as a native Swift macOS app. It intentionally exceeds the normal 500-line documentation limit because the project owner requested a single self-contained rebuild specification.

## LLM Role

You are a senior Swift macOS engineer. Rebuild nota as a native macOS app with the same UI, behavior, window model, keyboard workflow, settings, and data model as the existing app. Use Swift, SwiftUI, and AppKit where needed. Preserve the product identity and keep the app small, fast, local-first, and keyboard-first.

## Product Summary

nota is a floating macOS to-do list for developers. It appears quickly from a global shortcut, supports Vim-style navigation, stores all data locally, and avoids accounts or network dependencies.

Product copy:

```text
nota
Version 0.1.0
A keyboard-first to-do list for developers. Made for simplicity and productivity.

Feel free to make any PRs/ suggestions for new features!
```

## Technical Target

- Platform: macOS.
- Language: Swift.
- UI: SwiftUI for declarative layout, AppKit where exact native behavior is required.
- Window: frameless, transparent, rounded, floating utility style.
- Persistence: local Codable JSON under Application Support.
- Rich text editor: wrap `NSTextView` because tasks need exact cursor control, rich text, links, formatting, selection ranges, and Vim modes.
- Global hotkey: use Carbon Event Hot Keys or a proven Swift package.
- App icon: simple lowercase `n` using JetBrains Mono style.
- Core app behavior must not require a network connection.

## Icon Recreation

Recreate the app icon as a clean 1024 x 1024 source asset, then export all smaller app icon sizes from that master. The current icon is intentionally simple: a dark rounded square with a muted border, a large lowercase `n`, and a short blue underline.

Master canvas:

- Size: `1024 x 1024`.
- Background outside the app shape: transparent.
- Main shape bounds: approximately `x 47`, `y 47`, `width 930`, `height 930`.
- Main shape: rounded rectangle or macOS-style squircle.
- Outer corner radius: approximately `214`.
- Fill color: `#08080B`.
- Stroke color: `#505158`.
- Stroke width: approximately `18`.
- The visible icon content should be centered and should not touch the canvas edges.

Letter mark:

- Text: lowercase `n`.
- Typeface: `JetBrains Mono`.
- Weight: ExtraBold or Bold. Use ExtraBold if available.
- Color: `#F4F4F5`.
- Approximate glyph bounds in the 1024 master: `x 356`, `y 366`, `width 312`, `height 358`.
- Optical placement matters more than font-size math. The `n` should feel centered horizontally and sit slightly above the underline.
- If using a design tool, convert the text to outlines after setting the font so exports do not depend on local font availability.

Underline:

- Shape: rounded rectangle.
- Bounds: approximately `x 354`, `y 778`, `width 316`, `height 36`.
- Corner radius: `18`.
- Fill color: `#60A2F9`.
- No stroke.
- The underline should align with the visual width of the `n`, not the full icon.

Recommended Figma or Sketch steps:

1. Create a `1024 x 1024` frame with transparent background.
2. Draw a rounded rectangle at `47, 47` sized `930 x 930`.
3. Set fill to `#08080B`, stroke to `#505158`, stroke width `18`, corner radius about `214`.
4. Add lowercase `n` in JetBrains Mono ExtraBold, color `#F4F4F5`.
5. Resize and position the outlined `n` to visually match bounds `356, 366, 312, 358`.
6. Add the underline rounded rectangle at `354, 778` sized `316 x 36`, radius `18`, fill `#60A2F9`.
7. Export the master as `icon.png` at `1024 x 1024`.

Recommended macOS export steps from the 1024 PNG:

```sh
mkdir -p icon.iconset
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
cp icon.png icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o icon.icns
```

For the existing Tauri asset set, also export these PNG sizes from the same master: `32`, `128`, `256`, `30`, `44`, `50`, `71`, `89`, `107`, `142`, `150`, `284`, and `310`.

## Engineering Rules

- Keep every source file under 500 lines.
- Split by responsibility: app shell, window controller, stores, models, settings UI, task row, task editor, keymaps, Vim engine, tags, persistence, themes.
- Avoid circular dependencies between views, view models, stores, and persistence.
- Add tests for data transforms, key handling, sorting, persistence normalization, and Vim command behavior.
- Prefer small deterministic pure functions for sorting, movement, shortcut formatting, persistence normalization, and Vim operations.

## Native Window

The rebuilt app must behave like the current floating overlay.

- Product name: `nota`.
- Version: `0.1.0`.
- Bundle identifier equivalent: `com.nota.desktop`.
- Default window size: `380 x 560`.
- Minimum size: `300 x 400`.
- Maximum size: `800 x 900`.
- First launch position: top right of active screen with `16px` edge offset.
- Restore saved window size and position on launch and on global toggle show.
- Clamp restored size and position to the visible work area.
- Ignore invalid or offscreen positions and fall back to top right.
- Migrate saved legacy size `380 x 500` to `380 x 560`.
- Frameless, transparent window with no native traffic-light chrome.
- App shell has `12px` radius and clips all white/transparent window corners.
- The custom title bar is draggable and must save the final position.
- Resizing must save the final size.
- Closing hides instead of quitting.
- Default global toggle shortcut: `Option + Shift + N`.
- Showing from global toggle must restore/clamp geometry, show the window, and focus it.

## App Layout

```text
Rounded app shell
  Title bar, 36px high
  Tab bar, 32px high
  Scrollable item list
  Settings overlay, full app overlay when open
```

Global visual rules:

- Default font: `JetBrains Mono`, monospace fallback.
- Default font size: `13`.
- Default configurable radius: `8`.
- Body text color and surfaces come from the active theme.
- Letter spacing remains normal.
- No decorative gradients or marketing sections.
- Use compact icon buttons where possible.

## Data Model

Use stable IDs for all tabs and items.

```swift
enum ItemState: String, Codable {
    case active
    case done
}

struct ItemTag: Codable, Equatable, Identifiable {
    var id: String { normalizedName }
    var name: String
    var color: String
    var normalizedName: String
}

struct Item: Codable, Identifiable {
    var id: String
    var richText: CodableRichText
    var state: ItemState
    var tags: [ItemTag]
    var createdAt: TimeInterval
}

struct Tab: Codable, Identifiable {
    var id: String
    var title: String
    var items: [Item]
    var createdAt: TimeInterval
}

struct AppState: Codable {
    var tabs: [Tab]
    var activeTabId: String
}
```

Settings must include:

- theme key
- font
- font size, range `10...20`, default `13`
- border radius, range `0...12`, default `8`
- item limit, range `5...50`, default `15`
- open on startup, default `false`
- show in Dock, default `true`
- show in menu bar, default `false`
- editable shortcut map
- optional window position
- optional window size

Initial app state:

- one tab
- title `Untitled`
- no items
- cursor index `-1`
- mode `nav`

## Persistence

Store notes separately from settings.

- Notes file equivalent: `notes.json`.
- Notes key equivalent: `state`.
- Settings file equivalent: `settings.json`.
- Settings key equivalent: `settings`.
- Debounce saves by about `300ms`.
- On corrupt data, log failure, reset that store to defaults, and continue.

Normalize data on load:

- If no tabs exist, create one default tab.
- If active tab ID is invalid, select the first tab.
- Missing tags become an empty array.
- Tag names are trimmed and internal whitespace is collapsed.
- Empty tag names are rejected.
- Unknown fonts fall back to `JetBrains Mono`.
- Old `CommandOrControl+Shift+N` and `Alt+Shift+N` toggle shortcuts migrate to `Alt+Shift+KeyN`.
- Old `CommandOrControl+Shift+R` rename shortcut migrates to disabled.
- Old `Enter` edit item shortcut migrates to `I`.

## App Modes

Main app modes:

- `nav`: list navigation.
- `edit`: editing focused task text or tags.
- `move`: keyboard item selection and movement.
- `tabs`: keyboard focus is on the tab bar.
- `tabMove`: active tab is being reordered.

Task editor modes:

- `insert`
- `normal`
- `visual`
- `visualLine`

## Shortcut Defaults

Use this shortcut map and make user-editable shortcuts for every editable row.

| Key | Default | Action |
| --- | --- | --- |
| toggleWindow | Option+Shift+N | show or hide window globally |
| newTab | Cmd+T | create tab |
| deleteTab | Cmd+W | delete current list |
| openSettings | Cmd+, | open or close settings |
| checkItem | Cmd+Enter | toggle done |
| renameTab | disabled | legacy only, tab rename is via tab focus `i` |
| moveTabLeft | Shift+< | move current tab left |
| moveTabRight | Shift+> | move current tab right |
| createItemBelow | o | create item below |
| createItemAbove | O | create item above |
| editItem | i | edit focused item |
| deleteItem | Delete | delete focused item |
| enterMoveMode | Space | enter item move mode |
| undo | u | app-level undo outside task editor |
| openItemLink | Cmd+X | open first link on focused task |
| sortByTag | Cmd+. | toggle rarest-tag sorting |

Shortcut display must show human-readable macOS labels, never placeholder text.

## Title Bar

Height: `36`.

Layout:

- Left column `64`: three small dots.
- Center column: app name `nota`, aligned start, font size `12`.
- Right column `64`: tag sort button and settings button.
- Close dot is red `#ef4444` and hides the window.
- Minimize dot is amber `#f59e0b` and minimizes the window.
- Disabled dot uses border color.
- Dot size `8 x 8`, gap `8`, left padding `12`.
- Icon buttons are `28 x 28`.
- Tag sort button sits next to settings.
- Tag sort disabled when current tab has no tags and tag sort is inactive.
- Settings button opens settings overlay.

## Tabs

- Tab bar height `32`.
- Horizontal scroll, padding `0 8`, gap `8`, hidden scrollbar.
- Tab text font size `12`.
- Active tab has accent bottom border.
- Keyboard-focused active tab uses accent muted background and inset accent outline.
- Moving tab uses surface hover background, accent outline, and accent text.
- Each tab has an `x` delete button.
- There is a `+` add tab button.
- Double click tab to rename.
- Right click shows a small delete context button.
- Title edit input width `120`, max title length `40`, accent underline.
- Empty titles normalize to `Untitled`.
- New tab appends, becomes active, and enters title editing.
- Deleting the last tab creates a fresh default tab.
- Deleting active tab activates the previous tab when possible.
- Reordering active tab preserves active selection.

## Item List and Rows

List:

- Scrollable vertical list fills remaining window.
- Padding `8`, hidden scrollbar.
- Empty text is exactly `Press o to add an item`.
- Empty text top margin `24`, centered, muted, font size `15`, weight `600`.
- Show `limit reached` in red `#f87171` at font size `11` when item limit is reached.
- Moving cursor with `j/k` must scroll focused row into view using nearest behavior.

Row:

- Grid columns: drag handle `16`, check/select `24`, body `1fr`.
- Minimum height `32`.
- Padding `8`.
- Left border `2`, transparent by default.
- Radius uses setting.
- Focused row has accent left border and accent muted background.
- Selected row has surface hover background.
- Done row uses `doneOpacity` and line-through.
- Drop before shows inset top accent line.
- Drop after shows inset bottom accent line.
- Drag handle size `16 x 18`, muted color, grab cursor.
- Select circle size `12 x 12`, margin top `2`, muted border.
- Selected circle has accent border and fill.
- Rich text line height `1.35`, wraps anywhere.
- Links are accent colored and underlined with `2px` underline offset.

Vim cursor:

- Show only in task edit normal or visual modes.
- Do not show in settings About.
- In normal mode, hide native caret and draw a blinking white block cursor.
- Cursor width `9`.
- Position slightly left of the character, about `3px`.
- Min height `16`.
- White background with difference blending.
- Blink visible roughly first 45 percent of a 1 second stepped cycle.
- In visual mode, cursor width `2`.

## Tags and Links

Slash menu:

- Trigger when insert-mode text before cursor ends with `/query`.
- `/link` opens the link popup.
- Any other non-empty slash query creates or selects a tag.
- Existing active tags appear as suggestions if they start with query and are not already on the task.
- Do not create a tag named `link`.
- `Enter` uses selected suggestion.
- `Escape` dismisses and removes slash text.
- Typing `j` or `k` while slash menu is open must insert text, not navigate the app.

Tag rules:

- A task can have multiple tags.
- Tag identity is case-insensitive normalized name.
- New tag color is random from the palette in the UI appendix.
- Existing tag color is reused for matching normalized name.
- Suggestions only include tags still present on at least one task.
- Right Arrow at task text end enters tag focus if tags exist.
- Left/Right arrows move through tags.
- Backspace or Delete removes focused tag.
- Left Arrow on first tag returns focus to task text.
- Escape from tags returns focus to task text.

Link popup:

- Opens from `/link`.
- Width `220`, gap `6`, padding `8`.
- Focus jumps immediately to Label.
- `Tab` or empty-field `n` moves to URL.
- `Shift+Tab` or empty-field `N` returns to Label.
- `Enter` inserts link if both fields are non-empty.
- `Escape` cancels.
- After insert, close popup, focus editor, and set normal mode.
- `A` after a link moves to task end, clears link typing attributes, and enters insert mode.

## Release and README

The Swift rebuild should be suitable for open source distribution.

- Include README instructions that users should open the `.app` file from Finder.
- If Swift replaces Tauri, update requirements to Xcode and Swift toolchain rather than Rust.
- Include build, test, local install, signing, notarization, and DMG steps.
- Include contribution guidelines and keyboard basics.
- A notarized release should be distributed through GitHub Releases as a DMG.

## Suggested Swift Architecture

- `NotaApp`: app entry, app delegate, menu bar and Dock policy.
- `WindowController`: frameless window setup, dragging, geometry restore and save, global hotkey.
- `Models`: app state, tab, item, tags, settings, shortcut types.
- `PersistenceStore`: load, normalize, debounce, save notes and settings.
- `NotesStore`: tab, item, move mode, done, delete, undo, tag sort.
- `SettingsStore`: theme, font, radius, item limit, behavior toggles, shortcut capture.
- `ThemeCatalog`: exact theme values.
- `ShortcutFormatter`: parse, capture, display macOS shortcuts.
- `AppKeymap`: root app navigation, command shortcuts, move mode, tab mode.
- `TaskEditor`: SwiftUI wrapper around `NSTextView`.
- `TaskVimEngine`: per-editor Vim state and commands.
- `SlashMenuController`: slash detection, suggestions, link popup state.
- `TagController`: tag normalization, color assignment, suggestions, keyboard tag focus.
- `SettingsPanel`: settings overlay and settings keymap.

The final app should look and behave like the existing nota build, not like a generic SwiftUI document app.

# UI Details

This section contains exact UI tokens, theme values, fonts, and settings layout details for the native Swift rebuild.

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

# Behavior Details

This section contains detailed navigation, Vim, movement, sorting, and verification requirements for the native Swift rebuild.

## Main Navigation

In nav mode:

- `j`: move focused item down, wrapping.
- `k`: move focused item up, wrapping. If already at first item, enter tabs mode.
- `H`: move to top visible item.
- `M`: move to middle visible item.
- `L`: move to bottom visible item.
- `h`: switch to previous tab.
- `l`: switch to next tab.
- `o`: create item below and enter edit.
- `O`: create item above and enter edit.
- `i`: edit focused item.
- `dd`: delete focused item, where the second `d` arrives within `500ms`.
- Delete: delete focused item.
- Space: enter move mode.
- `u`: app-level undo.
- `Cmd+1...Cmd+9`: switch to numbered tab.
- `Cmd+T`: new tab.
- `Cmd+W`: delete active tab.
- `Cmd+,`: toggle settings.
- `Cmd+.`: toggle tag sort for active tab.
- `Cmd+X`: open first link on focused task.

Tabs mode:

- Entered by pressing `k` on the first item.
- Active tab gets a focused visual state.
- `h/l`: switch active tab.
- `i`: rename active tab.
- Space: enter tab move mode.
- `j` or Escape: return to nav mode.

Tab move mode:

- Active tab gets moving visual state.
- `h/l`: reorder active tab left or right.
- Space or Escape: apply order and return to tabs mode.

## Move Mode

- Enter with Space from nav mode on a focused item.
- If focused item is not already selected, select only that item.
- Space or Escape exits move mode and clears selection.
- `u`: app-level undo, separate from task editor undo.
- `d`: delete selected tasks.
- `j/k`: reorder selected tasks within current tab.
- `Shift+j/k`: range select from anchor to next item.
- `Cmd+j/k` or `Ctrl+j/k`: add or remove one item at a time.
- `h/l` or Left/Right: move selection to adjacent tab.
- Keyboard movement preserves selection visuals and cursor.

Pointer drag:

- Drag handle starts item drag.
- If dragged item is in current selection, drag all selected items.
- Otherwise drag only that item.
- Drag over another item shows before/after drop line based on vertical midpoint.
- Drag over a tab marks it as drop target.
- Dropping on a tab moves items to that tab up to item limit.
- Dropping on an item reorders inside that tab.
- Cancelling drag clears drag and drop state.

## Task Editor

Use an `NSTextView` wrapper with a per-task Vim controller. Do not use a plain SwiftUI `TextField`.

Editing behavior:

- Clicking a task focuses it and enters edit mode.
- When a task becomes editable, default to insert mode and focus at end.
- Escape in insert mode enters normal mode.
- Escape in normal mode exits task editing to nav.
- Escape in visual modes clears selection and returns to normal.
- `Cmd+B`, `Cmd+I`, `Cmd+U` format selection or active typing attributes.
- `Cmd+Enter` toggles done.
- `Cmd+X` opens first link in focused task.
- Clicking a link opens it externally.
- After inserting a link through `/link`, return to normal mode.
- Pressing `A` in normal mode moves to task end, clears link typing attributes, and enters insert mode.

Task Vim movement:

- `h` or Left Arrow: move one character left.
- `l`, Space, or Right Arrow: move one character right.
- Up Arrow: move to start of task.
- Down Arrow: move to end of task.
- `j/k`: no-op inside one-line tasks.
- `w/b`: jump by word.
- `W/B`: jump by whitespace-delimited WORD.
- `0/$`: start and end of task.
- `gg/G`: start and end of task.
- `%`: jump between matching brackets, parentheses, or braces.

Task Vim modes:

- `i`: insert at cursor.
- `a`: insert after cursor.
- `I`: insert at task start.
- `A`: insert at task end after clearing link mark.
- `v`: visual character selection.
- `V`: visual line selection, which selects the whole task.

Task Vim editing:

- `u`: editor undo while inside a task editor.
- `Ctrl+R`: editor redo while inside a task editor.
- `x` or Delete: delete character under cursor.
- `yy`: yank whole task text to task-local Vim clipboard.
- `p`: paste after cursor.
- `dd`: clear task text and store previous text in Vim clipboard.
- `ciw`: change inner word and enter insert.
- `ciW`: change inner WORD and enter insert.
- `di(`: delete inside parentheses.
- `da(`: delete around parentheses.
- `cit`: change text inside an HTML/XML tag and enter insert.

Task Vim search and replace:

- `/pattern`: start a task-local search.
- Enter: confirm search.
- `n`: next search match.
- `N`: previous search match.
- `:%s/old/new/g`: replace all matches in task.
- `:%s/old/new/gc`: confirm each replacement.
- Escape cancels pending search or ex command.

## Slash Menu, Tags, and Links

Slash detection:

- In insert mode, if text before cursor ends with `/query`, show slash menu below cursor.
- Menu width `200`, max height `180`, padding `4`.
- Menu uses surface background, border, radius, and shadow.

Slash actions:

- `/link` opens link popup.
- Any other non-empty query creates or selects a tag.
- Existing tags appear as suggestions when they start with query and are not already on task.
- If query exactly matches `link`, do not create a tag.
- If query exactly matches an existing tag, do not create duplicate.
- Enter uses selected suggestion.
- Escape dismisses and removes slash text.
- Typing letters, including `j` and `k`, remains text input.

Tag behavior:

- A task can have multiple tags.
- Normalize by trimming, removing leading slashes, collapsing whitespace, and lowercasing for identity.
- Reuse existing color for matching normalized tag.
- Randomly assign palette color for a new tag.
- Active tag suggestions are derived only from tags present on at least one task.
- When the final task using a tag loses it or is deleted, remove the tag from suggestions.

Tag UI:

- Tags sit to the right of task text and wrap.
- Gap `4`.
- Tag height `18`.
- Max width `112`.
- Pill radius `999`.
- Border and text color are tag color.
- Padding `0 3 0 6`.
- Font size `10`.
- Remove button `12 x 12`, circular, with an `x`.
- Active keyboard tag has subtle color background and one-pixel outline.

Tag keyboard:

- Right Arrow at text end enters tag focus if tags exist.
- Left/Right arrows move through tags.
- Backspace or Delete removes focused tag.
- Left Arrow on first tag returns to task text in normal mode.
- Escape returns to task text in normal mode.
- A strong blinking cursor or equivalent focus indicator remains visible in tag area.

Link popup:

- Opens from `/link`.
- Width `220`, gap `6`, padding `8`.
- Two inputs: Label and URL.
- Focus jumps immediately to Label.
- `Tab` or empty-field `n`: move to URL.
- `Shift+Tab` or empty-field `N`: move to Label.
- Enter inserts link if both fields are non-empty.
- Escape cancels.
- After insertion, close popup, focus editor, and set normal mode.
- Normalize missing URL scheme to usable external URL.
- Popup always disappears after submit, cancel, blur away, or editor exit.

## Done, Delete, Undo, and Sort

Done:

- `Cmd+Enter` toggles focused task done.
- Done tasks are crossed out and moved to bottom.
- Unchecking removes done styling and keeps the task in the list.
- There is no archive UI or behavior.

Delete:

- `dd` deletes focused task in nav mode.
- Delete deletes focused task.
- `d` in move mode deletes selected tasks.
- `Cmd+W` deletes current list.

Undo:

- App-level mutations push previous app state.
- App-level `u` restores previous app state.
- Restore resets mode to nav, clears selection and drag state, and clears active tag sort state.
- Task editor `u` is editor undo and must not trigger app-level undo.

Tag sort:

- Button lives next to settings in title bar.
- Shortcut `Cmd+.` toggles it.
- Sorting is per active tab.
- On enable, save original item ID order for that tab.
- On disable, restore saved order.
- New items not in saved order append after restored items.
- Done items stay after active items.
- Untagged items sort after tagged items within their done or active group.
- For multiple tags, choose the rarest tag as primary sort tag.
- Rarest means tag appears on the fewest tasks in current tab, counted once per task.
- Tie break by normalized tag name alphabetically.
- Final tie break by original item order.

## Acceptance Checklist

- Fresh launch appears top right at `380 x 560`.
- Move and resize window, hide it, toggle back, and geometry persists.
- Offscreen stored position clamps or falls back.
- `Option+Shift+N` toggles visibility.
- `Cmd+,` opens and closes settings.
- `Cmd+W` deletes current list and creates a replacement when it was the last list.
- `o` creates a task below and enters editing.
- `O` creates above.
- `i` edits a task and Enter is not required.
- `j/k` move list cursor and scroll focused row into view.
- `H/M/L` move to top, middle, bottom visible item.
- Tab focus with `k` on first item works.
- Tab switching with `h/l`, rename with `i`, and reorder with Space plus `h/l` work.
- Item move mode supports single selection, range selection, multi selection, reorder, adjacent-tab move, delete selected, and undo.
- Pointer drag reorders within a tab and moves between tabs.
- Done tasks cross out and move to bottom.
- There is no archive UI or behavior.
- Slash menu supports `/link`, existing tags, and create tag.
- Typing `j` or `k` in slash mode inserts those letters.
- Tag colors persist while any task still uses the tag.
- Tags disappear from suggestions when no task uses them.
- Keyboard tag focus, tag deletion, and returning to task text work.
- `/link` focuses Label.
- Tab or `n` moves link popup focus to URL.
- Shift+Tab or `N` returns link popup focus to Label.
- Enter inserts link, popup closes, and editor returns to normal mode.
- `A` after a link exits link typing and appends normal text.
- Links are underlined and `Cmd+X` opens first focused task link.
- Normal-mode Vim cursor is thick, white, blinking, and covers intended character.
- All listed task Vim motions, modes, editing commands, search, and replace work per task.
- Settings keyboard navigation remains usable after changing font, toggles, sliders, and themes.
- Up/Down arrow keys affect only the theme grid and no other setting.
- About has no selector cursor.
- All themes and fonts render without clipping or unreadable contrast.
- App-level undo and task-editor undo are separate.
