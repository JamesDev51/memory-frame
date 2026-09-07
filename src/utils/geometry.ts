import { getHeartSlots } from '../presets/layouts'
import type { EditorConfig, PhotoItem } from '../types/editor'
export const PRINT_SIZES = {
  A5: { widthMm: 148, heightMm: 210, hint: '작은 액자' },
  A4: { widthMm: 210, heightMm: 297, hint: '책상 · 선반 액자' },
  A3: { widthMm: 297, heightMm: 420, hint: '큰 액자 · 포토테이블' },
  A2: { widthMm: 420, heightMm: 594, hint: '대형 포스터' },
} as const
export type PrintSize = keyof typeof PRINT_SIZES
export type Rect = { x: number; y: number; width: number; height: number }
export function paper(config: EditorConfig, dpi = 300) {
  const size = PRINT_SIZES[config.printSize]
  const [widthMm, heightMm] = config.orientation === 'landscape' ? [size.heightMm, size.widthMm] : [size.widthMm, size.heightMm]
  return { widthMm, heightMm, width: Math.round(widthMm / 25.4 * dpi), height: Math.round(heightMm / 25.4 * dpi) }
}
export function slotsFor(config: EditorConfig, width: number, height: number): Rect[] {
  const gap = Math.min(width, height) * ({ narrow: .006, normal: .014, wide: .026 }[config.gap])
  if (config.layout.type === 'heart') {
    const side = Math.min(width * .83, height * .856)
    return getHeartSlots(config.layout.photoCount).map(s => ({
      x: (width - side) / 2 + s.x * side + gap / 2,
      y: (height - side) / 2 + s.y * side + gap / 2,
      width: s.width * side - gap, height: s.height * side - gap,
    }))
  }
  const { rows, columns } = config.layout
  const cell = Math.min((width * .83 - gap * (columns - 1)) / columns, (height * .856 - gap * (rows - 1)) / rows)
  const w = cell * columns + gap * (columns - 1), h = cell * rows + gap * (rows - 1)
  return Array.from({ length: config.layout.photoCount }, (_, i) => ({
    x: (width - w) / 2 + i % columns * (cell + gap),
    y: (height - h) / 2 + Math.floor(i / columns) * (cell + gap), width: cell, height: cell,
  }))
}
export function photoPlacement(photo: PhotoItem, width: number, height: number) {
  const contain = photo.fit === 'contain'
  const base = (contain ? Math.min : Math.max)(width / photo.naturalWidth, height / photo.naturalHeight)
  const scale = base * (contain ? 1 : Math.max(1, photo.scale))
  const w = photo.naturalWidth * scale, h = photo.naturalHeight * scale
  const maxX = Math.max(0, (w - width) / 2), maxY = Math.max(0, (h - height) / 2)
  const clamp = (n: number) => Math.max(-1, Math.min(1, n))
  return { x: (width - w) / 2 + (contain ? 0 : clamp(photo.offsetX) * maxX), y: (height - h) / 2 + (contain ? 0 : clamp(photo.offsetY) * maxY), width: w, height: h, scale, maxX, maxY }
}
export function photoDpis(config: EditorConfig, photos: PhotoItem[]) {
  const page = paper(config)
  const slots = slotsFor(config, page.width, page.height)
  return photos.map((photo, i) => Math.floor(300 / photoPlacement(photo, slots[i].width, slots[i].height).scale))
}
