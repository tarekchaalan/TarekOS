export interface AppDefaultWindow {
  w: number
  h: number
  minW: number
  minH: number
}

export interface AppSupports {
  openTypes: string[]
  mime: string[]
}

export interface AppEntry {
  bundle: string
  component: string
}

export interface AppDefinition {
  id: string
  name: string
  icon: string
  singleton: boolean
  defaultWindow: AppDefaultWindow
  supports: AppSupports
  entry: AppEntry
}

export interface FileAssociation {
  mime: string
  defaultApp: string
  openWith: string[]
}

export interface StartMenuConfig {
  pinned: string[]
  recommended: Array<{ kind: string; nodeId: string }>
}

export interface TaskbarConfig {
  pinned: string[]
  systemTray: string[]
}

export interface AppRegistry {
  version: string
  apps: AppDefinition[]
  fileAssociations: FileAssociation[]
  startMenu: StartMenuConfig
  taskbar: TaskbarConfig
}
