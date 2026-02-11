# TarekOS — Windows-Inspired Portfolio

A desktop-first portfolio website that behaves like a full operating system, built with React, TypeScript, and Tailwind CSS. Features a working window manager, virtual file system, terminal, and multiple applications — all running entirely in the browser.

## Features

### Desktop Environment

- **Window Manager** — open, drag, resize, minimize, maximize, restore, snap, and close windows with full z-order management and cascade positioning
- **Taskbar** — pinned app shortcuts, running app indicators with hover previews, system tray with clock and volume control, and a Show Desktop button
- **Start Menu** — pinned programs, "All Programs" list, system quick-links, and real-time search across apps and files
- **Desktop Icons** — draggable shortcuts placed from the virtual file system, with double-click to open and right-click context menus
- **Alt+Tab Switcher** — cycle through open windows with a visual overlay
- **Boot Sequence** — animated startup screen on first load
- **Keyboard Shortcuts** — Win key (Start Menu), Alt+Tab (window cycling), Win+D (show desktop), Win+E (explorer), and more

### Applications

- **Terminal** — full command-line interface with 20+ commands, tab completion for commands and VFS paths, command history, and syntax-highlighted output
- **Explorer** — file browser with breadcrumb navigation, grid/details view toggle, address bar navigation, and file type icons
- **Notepad** — text and markdown viewer/editor with syntax highlighting, word wrap, find & replace, and styled markdown rendering
- **Browser** — built-in web browser (iframe-based) with address bar, navigation controls, and automatic external tab fallback for sites that block framing
- **Resume Viewer** — PDF viewer with page navigation, zoom controls, and download
- **Photos** — image viewer with zoom, pan, and fit-to-window
- **Control Panel** — system settings for theme (dark/light), accent color, and wallpaper customization with categorized galleries
- **Minesweeper** — classic Minesweeper game with difficulty selection, timer, and flag counter
- **Snake** — classic Snake game with score tracking and speed progression

### System

- **Virtual File System (VFS)** — JSON-driven tree structure with directories, files, links, and shortcuts; powers the desktop, explorer, terminal, and file associations
- **App Registry** — JSON configuration mapping apps to their components, default window sizes, supported file types, and taskbar/start menu pinning
- **Theme Engine** — dark/light mode with customizable accent colors, applied globally via CSS custom properties
- **Context Menus** — right-click menus on desktop and file icons with contextual actions
- **Sound Effects** — system sounds for startup, shutdown, click, minimize, and error events with mute toggle
- **Shutdown Dialog** — Windows 7-style shutdown confirmation with animated transition

### Design

- **Windows 7 Aero** — translucent glass effects on taskbar, window titlebars, and menus using backdrop-filter
- **Authentic Start Orb** — three-state image button (default, hover, pressed) that protrudes above the taskbar
- **Win7 Window Chrome** — gradient titlebars, proper button layout (minimize/maximize/close), and inactive state styling
- **Custom Cursors** — Windows Aero cursor set for default and pointer states
- **Responsive Gate** — mobile visitors see a prompt to view on desktop for the intended experience

## Tech Stack

- **Framework:** React 19
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS 4
- **Build Tool:** Vite 7
- **State Management:** Zustand 5
- **PDF Rendering:** react-pdf
- **Markdown:** react-markdown + remark-gfm
- **Icons:** Lucide React
- **Animations:** Framer Motion

## Getting Started

```bash
# Clone the repository
git clone https://github.com/TarekChaalan/Tarek-OS.git
cd Tarek-OS

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview the production build locally
```

## Project Structure

```
src/
├── apps/              # Application components
│   ├── browser/       # Built-in web browser
│   ├── explorer/      # File explorer
│   ├── minesweeper/   # Minesweeper game
│   ├── notepad/       # Text/markdown editor
│   ├── photos/        # Image viewer
│   ├── resume/        # PDF resume viewer
│   ├── settings/      # Control panel
│   ├── snake/         # Snake game
│   └── terminal/      # Terminal with command system
├── data/              # VFS tree, app registry, and content files
├── shared/            # Types, utilities, hooks, and UI components
├── shell/             # Desktop environment (taskbar, start menu, windows)
└── system/            # Core systems (store, VFS, themes, sounds, keyboard)
```

## License

MIT

## Author

**Tarek Chaalan** — [github.com/TarekChaalan](https://github.com/TarekChaalan)
