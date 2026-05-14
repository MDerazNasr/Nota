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

Window event behavior:

- First launch chooses top-right placement only after the final screen work area is known.
- Saved positions are physical screen coordinates, not relative percentages.
- If a saved position's top-left point is outside every available monitor work area, discard it.
- If a saved position is inside a monitor but part of the window would extend beyond the work area, clamp x and y inward.
- If saved width or height is below minimum or above maximum, clamp before positioning.
- Moving the window writes the clamped final x and y to settings.
- Resizing the window writes clamped width and height to settings.
- Hide/show must not reset the saved geometry.
- Minimize uses native minimize and does not alter saved geometry.
- Close dot and close window event hide the window.
- The app can be dragged only from empty title-bar space or the title-bar drag region. Buttons inside the title bar must not start a drag.
- The pointer cursor does not need to change over the drag region, but drag must feel immediate with no threshold delay.

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

## Micro Layout Rules

Window and shell:

- The shell fills the full window, not a centered card inside the window.
- The shell clips all child content to the `12px` outer radius.
- The shell uses an inset one-pixel border in the active theme border color.
- The transparent window area outside the shell must not show white pixels.
- The app surface is a vertical flex stack: title bar, tab bar, then item list.
- Overlays sit above the app surface and cover the full shell.

Spacing rhythm:

- Horizontal shell padding is not global. Each region owns its own padding.
- Title bar left controls use `12px` left padding.
- Tab bar uses `8px` horizontal padding.
- Item list uses `8px` padding on every side.
- Settings tabs use `18px` side padding.
- Settings content uses `18px` side padding.
- Compact controls should stay between `24px` and `28px` high unless the row itself defines a larger height.

Visual emphasis:

- Focus is shown with accent color and muted accent fills, not heavy shadows.
- Active and focused are separate states. Active means selected data, focused means keyboard target.
- Selected items use surface hover background. Focused item uses accent-muted background and accent left border.
- Move mode selection uses the existing selected item visuals. Do not invent a separate color system.
- Done items remain readable but subdued with opacity and line-through.
- Hover states are subtle and use surface hover.
- Text should never touch the edge of a selector or pill. Use at least `8px` text padding in setting rows and shortcut rows.

Scroll behavior:

- Item list and tab bar hide scrollbars.
- Settings content shows a thin grey scrollbar.
- When keyboard focus changes to a row or item, scroll the nearest scroll container just enough to reveal it.
- Do not scroll the full window because the window itself does not scroll.

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

## Input Dispatch Rules

Every key press must be handled by exactly one active scope. Build a central dispatcher with this priority order:

1. Global macOS hotkey scope handles `Option+Shift+N` even when the app is hidden or unfocused.
2. If the app window is visible and the key is the editable Open Settings shortcut, default `Cmd+,`, toggle settings immediately.
3. If a shortcut capture button in Settings is active, all keys go to shortcut capture except global show/hide.
4. If the link popup is open, all typing, Tab, Shift+Tab, Enter, Escape, `n`, and `N` go to the link popup.
5. If a task slash menu is open, printable characters keep editing the slash query. Enter selects, Escape dismisses, and app navigation must not run.
6. If a task text editor is focused, task editor Vim handling owns the event, except app-level `Cmd+Enter` for done and `Cmd+X` for open link.
7. If a tag pill is focused, tag keyboard handling owns ArrowLeft, ArrowRight, Backspace, Delete, and Escape.
8. If Settings is open, the Settings keymap owns all non-captured keys, except `Cmd+,` and Escape which close Settings.
9. If app mode is `move`, move-mode keys own the event.
10. If app mode is `tabMove`, tab move keys own the event.
11. If a command shortcut with Command, Control, or Option matches an app command, run that command.
12. If app mode is `tabs`, tab focus keys own the event.
13. If app mode is `nav`, list navigation keys own the event.

Prevent default behavior whenever nota handles a key. Do not let a handled key also type into a field, scroll the page, activate a native button, or trigger a system beep.

Scope rules:

- Settings overlay visually covers the app and should block list navigation underneath.
- About has no selectable rows and no Vim cursor.
- App-level undo only runs in app scopes. Task editor undo only runs in task editor scopes.
- Arrow keys are context-specific. Never make arrow keys global app navigation.
- Printable letters are text input whenever an editable text field, task editor insert mode, slash query, link popup, or tab rename input is active.
- When focus leaves a task editor because Escape exits normal mode, return to nav mode and keep the list cursor on that task.
- When focus leaves Settings, restore app mode to `nav` unless a task editor is explicitly being focused by user click.

## Command Activation Details

Command shortcuts:

- `Cmd+,` always toggles Settings. If Settings opens, it opens to Appearance and row index `0`. If Settings closes, app mode becomes `nav`.
- `Cmd+T` creates a tab unless a text field, link popup, shortcut capture, or task insert mode owns the key.
- `Cmd+W` deletes the active list unless a text field, link popup, shortcut capture, or task insert mode owns the key.
- `Cmd+Enter` toggles done on the focused task from nav, move, or task edit. It does nothing when no task is focused.
- `Cmd+X` opens the first link in the focused task. It does nothing if the focused task has no link.
- `Cmd+.` toggles tag sort for the active tab. It does nothing when the tab has fewer than two items and sort is inactive.
- `Cmd+1` through `Cmd+9` switch to the matching tab index when it exists. Missing tab numbers do nothing.

Plain-key activation:

- `o` and `O` only create items in nav mode. They do nothing in settings, tab rename, link popup, task insert mode, or slash query.
- `i` edits the focused item in nav mode and renames the focused tab in tabs mode.
- Space enters move mode from nav mode, enters tab move mode from tabs mode, and exits move or tab move mode when already moving.
- `u` is app undo in nav and move mode only. In task normal mode, `u` is text-editor undo.
- `d` waits for a second `d` for up to `500ms` in nav mode. In move mode, one `d` deletes selected tasks.
- `h/l` switch tabs in nav and tabs mode. In task normal mode, they move inside task text. In settings, they switch settings sections.
- `j/k` move the list cursor in nav mode, select/reorder in move mode, and move the settings selector in Settings.

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

Title bar placement details:

- Use a three-column grid: `64px 1fr 64px`.
- Left dots are vertically centered.
- Dot container gap is `8px`.
- The name `nota` sits in the center column but is aligned to the start of that column, not centered in the whole window.
- Title text uses muted color and font size `12`.
- Right actions are right aligned with `4px` right padding.
- Icon glyphs are `14px` with stroke width around `1.75`.
- Icon buttons have transparent background normally.
- Icon buttons use surface hover background and primary text on hover.
- Disabled icon buttons keep transparent background and use about `35%` opacity.
- The tag sort button title is `Sort by rarest tag` when inactive and `Restore original order` when active.
- The settings button title or accessibility label is `Open settings`.

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

Tab interaction details:

- A tab button has min width `28` and max width `120`.
- A tab wrapper has max width about `148` so the delete button fits beside the title.
- Tab labels truncate with ellipsis and never wrap.
- Tab add button is visually the same height as tabs and shows `+`.
- The delete tab button is about `20px` wide, transparent, muted, and changes to primary text on hover.
- Clicking a tab activates it and clears selected task IDs.
- Activating a tab sets cursor to the first item if the tab has items, otherwise `-1`.
- Double-clicking a tab replaces the label with the title input.
- Title input focuses immediately and selects the full current title.
- Enter in the title input confirms by blurring.
- Escape in the title input confirms the current draft the same as blur.
- If the title input loses focus, normalize and save the title.
- Context delete menu appears below the tab at about `top 28`, width `96`, padding `8`, font size `11`.
- In tabs mode, only the active tab receives the keyboard focus visual.
- In tab move mode, the active tab remains active and receives the moving visual.
- Reordering at the first tab with `h` does nothing.
- Reordering at the last tab with `l` does nothing.

## Item List and Rows

List:

- Scrollable vertical list fills remaining window.
- Padding `8`, hidden scrollbar.
- Empty text is exactly `Press o to add an item`.
- Empty text top margin `24`, centered, muted, font size `15`, weight `600`.
- Show `limit reached` in red `#f87171` at font size `11` when item limit is reached.
- Moving cursor with `j/k` must scroll focused row into view using nearest behavior.

List behavior details:

- The item list is the only vertical scroll area in the main app surface.
- Empty state appears inside the list, not in the tab bar or title bar.
- When the active tab changes, cursor becomes first item index or `-1`.
- When a task is deleted, cursor clamps to the deleted index if another item exists there, otherwise the previous last item.
- When a task is created below, insertion index is current cursor plus one. If cursor is `-1`, insertion index is `0`.
- When a task is created above, insertion index is current cursor. If cursor is `-1`, insertion index is `0`.
- Creating an item immediately enters edit mode on that item.
- Attempting to create past the item limit does nothing and keeps the current mode and cursor.
- Moving `j/k` wraps within the active tab.
- Pressing `k` at cursor `0` enters tabs mode instead of wrapping to the bottom.
- Pressing `j` at the last item wraps to the first item.
- `H/M/L` are based on visible rows in the scrolled list, not the entire tab.
- If no visible row can be computed for `H/M/L`, keep the current cursor.

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

Row interaction details:

- Clicking a row without modifiers sets cursor to that row, clears multi-selection, and enters edit mode.
- Cmd-click, Ctrl-click, or Shift-click on a row toggles that item in the selected set and keeps app mode nav.
- Clicking the circular select control toggles selection and does not enter text editing.
- Clicking the drag handle never enters editing.
- Pointer drag starts only from the drag handle with primary mouse button.
- If the dragged item is already selected, drag the whole selected set. Otherwise select and drag only that item.
- During pointer drag, row drop target is computed by comparing pointer y to the row midpoint.
- A tab drop target clears item drop target, and an item drop target clears tab drop target.
- Pointer up on an item runs item reorder. Pointer up on a tab runs move to tab. Pointer cancel clears drag state.
- Row body uses horizontal flex so tags sit after text when there is room and wrap when needed.
- The text editor area flexes and can shrink, but it must never push tags outside the row.
- Long task text wraps within the row and can increase row height.
- A done row still allows selection, deletion, dragging, and editing.

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

Task focus details:

- Task edit mode is entered by click, by `i` in nav mode, or after creating an item with `o` or `O`.
- Entering edit mode from nav should focus the text at the end and begin in insert mode.
- Pressing Escape once from insert mode switches to normal mode and shows the block cursor.
- Pressing Escape again from normal mode exits to nav mode.
- Clicking outside a task editor exits edit mode unless focus moved into that task's link popup or tag controls.
- When edit mode exits, clear slash menu state, link popup state, and active tag index.
- Each task editor owns its own Vim clipboard, search state, command buffer, and pending ex command.
- Task editor state must not leak from one task to another.
- Native caret is visible only in insert mode.
- Block cursor position is computed from the current text selection's caret rectangle relative to the row.
- If caret rectangle lookup fails, hide the custom cursor rather than drawing it in the wrong place.
- Visual mode cursor is narrow because the text selection itself is the primary visual.

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

Slash menu placement details:

- Position the menu using the caret rectangle at the slash query end.
- The menu top is caret bottom plus about `4px`.
- The menu left is caret left.
- The menu overlays rows and is not clipped by the row.
- Menu width is `200`.
- Menu max height is `180`, with internal vertical scrolling when needed.
- Menu item padding is `6px 8px`.
- Menu item gap between label and description is `2px`.
- Menu labels use primary text, descriptions use muted text at font size `11`.
- Active or hovered menu item uses accent muted background.
- Existing tag suggestions include a small color dot about `8px`.
- The slash menu should update as the user types and disappear when the slash pattern no longer exists.

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

Tag keyboard details:

- Entering tag focus sets app mode to edit and task editor mode to normal.
- Active tag index starts at `0`.
- ArrowRight on a tag moves to the next tag and clamps at the final tag.
- ArrowLeft on a tag moves to the previous tag. From index `0`, it returns to task text.
- Removing a tag focuses the tag now occupying the same index. If no tag remains, return to task text.
- Clicking a tag remove button removes the tag without changing the task text.
- If active tag index points past the end after removal, clear tag focus and return to task text.

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

Link popup details:

- The popup is rendered above all task rows.
- It has surface background, theme border, radius, and a shadow around `0 8 24 rgb(0 0 0 / 24%)`.
- Label field appears first, URL field second.
- Both inputs are `28px` high with `8px` horizontal padding.
- Inputs use app background, primary text, border color, radius, and font size `12`.
- The initial label can be empty.
- Submit only if both label and URL are non-empty after trimming.
- Cancel must restore focus to the editor when possible and remove popup state.
- Inserting a link replaces the slash query with linked label text and immediately unsets the link mark for following text.
- The URL should be normalized so `example.com` opens as a valid external URL.

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

Overlay placement details:

- Settings is not a detached window. It is an in-app overlay covering the shell.
- It uses absolute positioning relative to the shell.
- Open state transform is `translateX(0)`.
- Hidden state transform is `translateX(100%)` and pointer events are disabled.
- The overlay z-index is above the app surface and below transient popups if any remain.
- The overlay header stays at the top and does not scroll.
- Only the settings section body scrolls.
- Opening Settings always resets active section to Appearance and selector index to `0`.
- Closing Settings clears the settings selector and returns app mode to nav.
- The close button is the same `28 x 28` icon-button style as title bar actions.

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

Appearance row activation:

- Theme row activation with Enter or Space advances to the next theme.
- Theme row Left/Right moves one theme backward or forward in the flattened theme order.
- Theme row Up/Down moves by five swatches because the grid has five columns.
- Theme movement wraps around the theme list.
- Font row activation focuses or opens the select control.
- Font row Left/Right changes selected font by one option and clamps at first or last font.
- Font row Space or Enter should open the font options if the platform supports it. If not, it should at least focus the select control.
- Font row must not trap focus after a font is selected.
- Font Size Left/Right changes by one point.
- Radius Left/Right changes by one point.
- Item Limit Left/Right changes by one item.
- Slider values clamp to their min and max.
- Reset button restores only that row's setting to default and keeps selector on the same row.

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

Navigation row activation:

- Behavior toggle rows activate with Enter or Space and flip the checkbox.
- Left on a behavior toggle sets it false.
- Right on a behavior toggle sets it true.
- Hotkey rows activate with Enter or Space and enter capture mode.
- Clicking a hotkey button also enters capture mode.
- Capture mode focuses the button and displays `Press keys`.
- In capture mode, Escape cancels and keeps the old shortcut.
- In capture mode, Backspace saves an empty disabled shortcut.
- In capture mode, any valid key chord saves immediately and exits capture mode.
- Updating the global toggle shortcut must unregister the old global shortcut and register the new one.
- If global shortcut registration fails, keep the displayed saved value but show a small settings error.
- Reference rows are selectable for keyboard consistency but Enter, Space, Left, and Right do nothing.
- Section labels are not selectable rows.
- The Navigation tab title must be `Navigation`, not `Hotkeys`.

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

Settings selector details:

- Selectable rows are elements marked as settings rows and currently visible.
- Selector movement wraps from last row to first row and first row to last row.
- The focused row gets accent-muted background and border color accent.
- The focused row radius is setting radius plus about `4px`.
- The focused row must scroll into view when moving through long settings content.
- Switching sections with `h/l` resets selector index to `0`.
- About has no settings rows. `j/k/Enter/Space/Arrow` should do nothing in About.
- Escape closes Settings from every settings section unless a hotkey capture is active.
- If a hotkey capture is active, Escape cancels capture instead of closing Settings.
- The settings keymap ignores keys originating from a hotkey capture element.
- The settings keymap should not treat typing in a native select menu as app navigation.

Arrow-key rules by context:

- In Settings theme row, ArrowLeft and ArrowRight move one swatch horizontally through flattened order.
- In Settings theme row, ArrowUp and ArrowDown move five swatches vertically and wrap.
- In Settings slider rows, ArrowLeft and ArrowRight decrement or increment by step. ArrowUp and ArrowDown do nothing.
- In Settings font row, ArrowLeft and ArrowRight change the selected font by one. ArrowUp and ArrowDown do nothing at the app keymap level.
- In Settings toggle rows, ArrowLeft sets unchecked and ArrowRight sets checked. ArrowUp and ArrowDown do nothing.
- In Settings hotkey rows, ArrowLeft and ArrowRight do nothing unless capture mode is active, in which case they are captured as shortcut keys when valid.
- In task text normal mode, ArrowLeft and ArrowRight move text cursor by character, ArrowUp moves to start, and ArrowDown moves to end.
- In task tag focus, ArrowLeft and ArrowRight move tag focus, Backspace/Delete removes tags, and ArrowUp/ArrowDown do nothing.
- In nav mode, arrow keys are not required for list navigation unless explicitly mapped later. Vim keys are primary.
- In move mode, Left/Right arrows move selection to adjacent tab and Up/Down may mirror `k/j` only if added intentionally.

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

Nav mode edge cases:

- If the active tab has no items, `j`, `k`, `H`, `M`, `L`, Space, Delete, `dd`, `i`, and `Cmd+Enter` do nothing.
- If the active tab has no items, `o` and `O` both insert the first item at index `0`.
- If cursor index is invalid after loading or deleting data, clamp it before handling a key.
- `h/l` tab switching wraps from first to last and last to first.
- Switching tabs clears selected items and exits move mode.
- Opening Settings from nav does not change active tab or cursor.
- Closing Settings returns to the same active tab and cursor.
- `dd` timing is local to nav mode. Entering another mode clears the pending first `d`.
- If the user presses `d` then any non-`d` key, the pending delete should expire or be ignored.

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

Mode transition visuals:

- In nav mode, the focused item row is highlighted unless Settings is open.
- In tabs mode, item focus is suppressed and active tab focus is highlighted.
- In tab move mode, item focus is suppressed and active tab moving state is highlighted.
- In move mode, focused item remains visible and selected items are highlighted.
- Exiting move mode with Space or Escape clears the selected highlight. No stale selected item should remain highlighted.

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

Move mode selection details:

- `selectionAnchorId` is the item that was focused when move mode started unless a selected set already contains the focused item.
- Plain `j/k` reorders selected items without changing which items are selected.
- Reordering down processes selected items from bottom to top so selected groups move as a block.
- Reordering up processes selected items from top to bottom so selected groups move as a block.
- Reordering at the top or bottom does nothing for items already against that boundary.
- `Shift+j/k` creates a contiguous range from anchor to the next cursor position.
- `Cmd+j/k` toggles only the next item in that direction while moving the cursor to it.
- When moving selected items to an adjacent tab, activate the target tab and keep moved items selected only if staying in move mode.
- If target tab lacks capacity because of item limit, move only the items that fit.
- If no selected item can move because the target tab is full, keep current tab, cursor, mode, and selection.
- Pressing `d` deletes all selected items across the active tab selection and exits to nav.
- Pressing `u` restores the previous app state and exits to nav.

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

Editor event details:

- Insert mode allows normal typing, deletion, native selection, and paste.
- Insert mode only intercepts Escape and app-level command shortcuts.
- Normal mode prevents printable characters from being inserted unless they are valid commands that enter insert mode.
- Visual mode extends selection when movement commands run.
- Visual line mode selects the full task content.
- Command buffers reset after a complete command, failed command, Escape, or mode exit.
- Search input and ex-command input are modal text buffers inside normal mode.
- While entering `/pattern` or `:%s/...`, printable keys append to that pending buffer and do not edit task text.
- Backspace inside a pending search or ex command removes one pending character.
- Enter confirms the pending search or ex command.
- Escape cancels the pending search or ex command.
- `Cmd+B/I/U` should work in insert, normal, and visual mode if there is a usable selection or typing range.
- In normal mode with no selection, formatting may toggle typing attributes for the current cursor position, but it must not insert text.

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

Micro-design acceptance:

- No white corners are visible around the rounded app shell on dark or light desktop backgrounds.
- Text in tabs, settings rows, shortcut buttons, tags, and item rows never touches its container edge.
- Long tab names truncate with ellipsis and do not push the delete button out of view.
- Long task text wraps and does not overlap tags.
- Tags wrap cleanly and do not overflow the row.
- The focused settings row remains visible while scrolling through Navigation.
- Changing font in Settings does not trap focus in the font control.
- Changing any checkbox does not make the selector disappear.
- ArrowUp and ArrowDown do not affect settings rows outside the theme grid.
- The slash menu is not clipped by the item row.
- The link popup always closes after submit, cancel, or editor exit.
- Stale move highlights do not remain after exiting move mode.
- The tag sort active button visibly differs from inactive state.
- Disabled tag sort button still occupies the same title-bar space, so the settings button does not shift.
- The app remains usable at minimum window size `300 x 400`.
- The app remains visually balanced at maximum window size `800 x 900`.
