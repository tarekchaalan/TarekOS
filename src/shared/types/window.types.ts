export type WindowId = string

export type WindowMode = 'normal' | 'minimized' | 'maximized'

export type SnapRegion =
  | 'none'
  | 'left'
  | 'right'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'

export interface WindowRect {
  x: number
  y: number
  w: number
  h: number
}

export interface WindowInstance {
  id: WindowId
  appId: string
  title: string
  icon?: string

  mode: WindowMode
  snap: SnapRegion

  rect: WindowRect
  restoreRect?: WindowRect

  z: number
  focused: boolean

  resizable: boolean
  draggable: boolean
  minW: number
  minH: number

  createdAt: number
  updatedAt: number

  payload?: unknown
}
