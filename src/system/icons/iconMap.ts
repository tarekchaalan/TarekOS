/**
 * Maps semantic icon names (used in apps.json, vfs.json, and components)
 * to Windows 7 .ico asset paths in public/assets/icons/.
 */

const BASE = '/assets/icons'

export const WIN7_ICONS: Record<string, string> = {
  // ── App icons ──────────────────────────────────────────
  'icon.explorer':     `${BASE}/file_explorer.ico`,
  'icon.terminal':     `${BASE}/cmd.ico`,
  'icon.notepad':      `${BASE}/notepad.ico`,
  'icon.pdf':          `${BASE}/pdf_file.ico`,
  'icon.photos':       `${BASE}/ms_paint.ico`,
  'icon.browser':      `${BASE}/internet_explorer.ico`,
  'icon.settings':     `${BASE}/control_panel.ico`,
  'icon.minesweeper':  `${BASE}/minesweeper.ico`,
  'icon.snake':        `${BASE}/snake.ico`,

  // ── Desktop / system ───────────────────────────────────
  'icon.computer':     `${BASE}/my_pc.ico`,
  'icon.mycomputer':   `${BASE}/my_pc.ico`,
  'icon.folder':       `${BASE}/folder_full.ico`,
  'icon.folderOpen':   `${BASE}/folder_full.ico`,
  'icon.file':         `${BASE}/txt_file.ico`,
  'icon.recycle':      `${BASE}/bin_empty.ico`,
  'icon.recycleFull':  `${BASE}/bin_full.ico`,
  'icon.drive':        `${BASE}/file_explorer.ico`,
  'icon.app':          `${BASE}/file_explorer.ico`,

  // ── Start menu right column ────────────────────────────
  'icon.documents':    `${BASE}/documents_folder.ico`,
  'icon.pictures':     `${BASE}/photos_folder.ico`,
  'icon.games':        `${BASE}/games_folder.ico`,
  'icon.recentDocs':   `${BASE}/documents_folder.ico`,
  'icon.controlPanel': `${BASE}/control_panel.ico`,

  // ── File type icons ────────────────────────────────────
  'icon.text':         `${BASE}/txt_file.ico`,
  'icon.markdown':     `${BASE}/txt_file.ico`,
  'icon.json':         `${BASE}/txt_file.ico`,
  'icon.image':        `${BASE}/ms_paint.ico`,
  'icon.link':         `${BASE}/internet_explorer.ico`,
  'icon.shortcut':     `${BASE}/file_explorer.ico`,

  // ── Misc system ────────────────────────────────────────
  'icon.bluetooth':    `${BASE}/bluetooth.ico`,
  'icon.wifi':         `${BASE}/wifi_max_signal.ico`,
  'icon.gamesIcon':    `${BASE}/games_icon.ico`,
} as const

/**
 * Returns the asset path for a given icon name, falling back to generic file icon.
 */
export function getIconPath(name: string): string {
  return WIN7_ICONS[name] ?? WIN7_ICONS['icon.file']
}
