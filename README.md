# Objective Tracker

A cross-platform Tauri desktop app for tracking objectives with sections, tasks, and subtasks.

## Features

- Sections with progress bars
- Tasks and subtasks with checkboxes
- Task deadlines with optional times
- Drag-and-drop reordering
- Color themes persisted across restarts
- Local data persistence
- Native minimize, fullscreen, and close controls

## Development

```text
npm install
npm start
```

## Production Builds

Run each platform build on its native operating system:

```text
npm run build:windows
npm run build:macos
```

Windows installers are written to `src-tauri/target/release/bundle/`. macOS bundles are written to the same directory when built on macOS.
