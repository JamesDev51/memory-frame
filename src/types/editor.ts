export type LayoutType = 'grid' | 'heart'
export type GapPreset = 'narrow' | 'normal' | 'wide'
export type FrameKind = 'solid' | 'dot' | 'check'
export type ShadowMode = 'on' | 'off'

export interface PhotoItem {
  id: string
  file: File
  url: string
  naturalWidth: number
  naturalHeight: number
  scale: number
  offsetX: number
  offsetY: number
  fit: 'cover' | 'contain'
  rotation: 0 | 90 | 180 | 270
}

export interface LayoutPreset {
  id: string
  type: LayoutType
  photoCount: number
  rows: number
  columns: number
  label: string
}

export interface FrameVariant {
  id: string
  label: string
  backgroundColor: string
  patternColor?: string
  previewClass: string
}

export interface FramePreset {
  id: string
  label: string
  kind: FrameKind
  variants: FrameVariant[]
}

export interface EditorConfig {
  layout: LayoutPreset
  gap: GapPreset | number
  frameId: string
  frameVariantId: string
  shadow: ShadowMode
  printSize: 'A5' | 'A4' | 'A3' | 'A2' | '5x7' | '8x10' | 'custom'
  customWidthMm: number
  customHeightMm: number
  printUse: 'frame' | 'poster'
  mat: 'minimal' | 'normal' | 'wide'
  frameOverlapMm: 3 | 5 | 8
  orientation: 'portrait' | 'landscape'
  colorMode: 'color' | 'photos-gray' | 'all-gray'
}
