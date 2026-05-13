# nota

A keyboard-first to-do list for macOS.

nota is a small floating task app built for developers who prefer keyboard workflows. It opens and hides with a global shortcut, keeps the interface minimal, and supports Vim-style navigation for moving through tabs, tasks, tags, links, and settings without reaching for the mouse.

## Features

- Native macOS app built with Tauri, React, and TypeScript
- Floating frameless window with saved size and position
- Global show/hide shortcut, defaulting to `Opt + Shift + N`
- Vim-style task navigation with normal, insert, and visual modes
- Rich task text with bold, italic, underline, and links
- Slash commands for links and reusable color-coded tags
- Keyboard-accessible tag navigation and deletion
- Multi-select task movement and reorder mode
- Completed tasks are crossed out and kept in the list until deleted
- Configurable themes, fonts, item limits, radius, and shortcuts
- Local-first persistence using Tauri store files

## Download

Prebuilt downloads should be published through GitHub Releases.

For now, you can build the macOS app locally:

```sh
npm install
npm run tauri build -- --bundles app
```

The built app will be created at:

```txt
src-tauri/target/release/bundle/macos/nota.app
```

Open that `.app` bundle from Finder for local use. If macOS blocks it because it is a local unsigned build, right-click the app in Finder and choose Open.

## Development

### Requirements

- macOS
- Node.js 20 or newer
- npm
- Rust stable, required for `npm run tauri dev` and all local app builds
- Tauri v2 system prerequisites

### Run Locally

```sh
npm install
npm run tauri dev
```

### Test

```sh
npm test
```

### Build

```sh
npm run build
npm run tauri build -- --bundles app
```

The full Tauri bundle target may require extra local signing or packaging setup. The app bundle command above is the recommended local build path.

## Keyboard Basics

### App

| Action | Default |
| --- | --- |
| Toggle window | `Opt + Shift + N` |
| Open settings | `Cmd + ,` |
| New tab | `Cmd + T` |
| Focus tabs | `k` from the first item |
| Switch focused tab | `h` / `l` |
| Rename focused tab | `i` |

### Tasks

| Action | Default |
| --- | --- |
| Move cursor | `j` / `k` |
| Top, middle, bottom visible item | `H` / `M` / `L` |
| Create item below | `o` |
| Create item above | `O` |
| Edit focused item | `i` |
| Delete focused item | `Delete` or `dd` |
| Check item | `Cmd + Enter` |
| Open first item link | `Cmd + X` |
| Undo | `u` |

### Editing

| Action | Default |
| --- | --- |
| Normal mode | `Esc` |
| Insert mode | `i` |
| Append after task/link | `A` |
| Visual mode | `v` |
| Select whole task | `V` |
| Normal-mode `j` / `k` in a task | No-op for one-line tasks |
| Format selection | `Cmd + B`, `Cmd + I`, `Cmd + U` |
| Link command | `/link` |
| Tag command | `/tag-name` |

### Tags

| Action | Default |
| --- | --- |
| Enter tags from task end | `Right Arrow` |
| Move between tags | `Left Arrow` / `Right Arrow` |
| Delete tag | `Backspace` or `Delete` |
| Return to task text | `Left Arrow` on first tag |

### Move Mode

| Action | Default |
| --- | --- |
| Enter move mode | `Space` |
| Range select | `Shift + J` / `Shift + K` |
| Add one item | `Cmd + J` / `Cmd + K` |
| Reorder selection | `j` / `k` |
| Move to adjacent tab | `h` / `l` |
| Apply and exit | `Space` |

Most shortcuts can be changed in Settings.

## Project Structure

```txt
src/
  components/        React UI components
  components/Settings
  hooks/             Keyboard and app behavior hooks
  lib/               Shared helpers, types, themes, shortcuts
  store/             Zustand stores and persistence helpers
  styles/            Split CSS modules
src-tauri/
  src/               Tauri commands, shortcuts, window state
  tauri.conf.json    App and bundle configuration
```

## Contributing

Contributions are welcome. Good first areas include keyboard polish, accessibility, theme additions, tests, packaging, and documentation.

Before opening a pull request:

1. Keep changes focused.
2. Follow the existing file structure and local patterns.
3. Keep source files under 500 lines.
4. Add or update tests for behavior changes.
5. Run:

```sh
npm test
npm run build
```

For native changes, also run:

```sh
npm run tauri build -- --bundles app
```

## Design Goals

- Keyboard-first, mouse-friendly second
- Fast local workflows
- No accounts or network dependency for core use
- Minimal UI with readable themes
- Small, focused modules that are easy to contribute to

## License

MIT. See [LICENSE](LICENSE).
