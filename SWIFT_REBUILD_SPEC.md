# Swift Rebuild Spec for nota

This is the primary prompt for rebuilding nota as a native Swift macOS app. Use the appendices for exact theme values, detailed navigation, settings behavior, and acceptance checks:

- `SWIFT_REBUILD_UI_APPENDIX.md`
- `SWIFT_REBUILD_BEHAVIOR_APPENDIX.md`

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
