export type LayoutType = 'grid' | 'heart'
export type GapPreset = 'narrow' | 'normal' | 'wide'
export type FrameType = 'solid' | 'dot' | 'check'

export interface LayoutPreset {
  id: string
  name: string
  type: LayoutType
  photoCount: number
  rows?: number
  columns?: number
  defaultGap: GapPreset
}

export interface FramePreset {
  id: string
  name: string
  type: FrameType
  backgroundColor: string
  patternColor?: string
  shadowEnabledByDefault: boolean
}

export interface PhotoItem {
  id: string
  source: string
  scale: number
  offsetX: number
  offsetY: number
  rotation: 0 | 90 | 180 | 270
}

export interface EditorState {
  layoutId: string
  frameId: string
  gap: GapPreset
  shadowEnabled: boolean
  photos: PhotoItem[]
}
