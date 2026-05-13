# Swift Rebuild Behavior Appendix

This appendix contains detailed navigation, Vim, movement, sorting, and verification requirements for the native Swift rebuild. Use it with `SWIFT_REBUILD_SPEC.md`.

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
