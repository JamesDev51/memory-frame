import { getHeartSlots } from '../presets/layouts'
import type { EditorConfig, PhotoItem } from '../types/editor'
export const PRINT_SIZES = {
  A5: { widthMm: 148, heightMm: 210, hint: '작은 액자' },
  A4: { widthMm: 210, heightMm: 297, hint: '책상 · 선반 액자' },
  A3: { widthMm: 297, heightMm: 420, hint: '큰 액자 · 포토테이블' },
  A2: { widthMm: 420, heightMm: 594, hint: '대형 포스터' },
  '5x7': { widthMm: 127, heightMm: 177.8, hint: '5×7인치 액자' },
  '8x10': { widthMm: 203.2, heightMm: 254, hint: '8×10인치 액자' },
} as const
export type PrintSize = keyof typeof PRINT_SIZES
export type Rect = { x: number; y: number; width: number; height: number }
export function paper(config: EditorConfig, dpi = 300) {
  const clampSize = (value: number) => Math.max(80, Math.min(600, Number.isFinite(value) ? value : 210))
  const custom = [clampSize(config.customWidthMm), clampSize(config.customHeightMm)].sort((a, b) => a - b)
  const size = config.printSize === 'custom' ? { widthMm: custom[0], heightMm: custom[1] } : PRINT_SIZES[config.printSize]
  const [widthMm, heightMm] = config.orientation === 'landscape' ? [size.heightMm, size.widthMm] : [size.widthMm, size.heightMm]
  return { widthMm, heightMm, width: Math.round(widthMm / 25.4 * dpi), height: Math.round(heightMm / 25.4 * dpi) }
}
export function safeMarginMm(config: EditorConfig) {
  const page = paper(config), short = Math.min(page.widthMm, page.heightMm)
  const overlap = config.printUse === 'frame' ? (config.frameOverlapMm ?? 5) + 3 : 3
  return Math.max(overlap, short * ({ minimal: .04, normal: .09, wide: .15 }[config.mat ?? 'normal']))
}
export function gapRatio(gap: EditorConfig['gap']) {
  return typeof gap === 'number' ? Math.max(0, Math.min(.026, Number.isFinite(gap) ? gap : .006)) : ({ narrow: .006, normal: .014, wide: .026 }[gap])
}
export function slotsFor(config: EditorConfig, width: number, height: number): Rect[] {
  const gap = Math.min(width, height) * gapRatio(config.gap)
  const page = paper(config)
  const margin = safeMarginMm(config) * width / page.widthMm
  const availableW = width - 2 * margin, availableH = height - 2 * margin
  if (config.layout.type === 'heart') {
    const side = Math.min(availableW, availableH)
    return getHeartSlots(config.layout.photoCount).map(s => ({
      x: (width - side) / 2 + s.x * side + gap / 2,
      y: (height - side) / 2 + s.y * side + gap / 2,
      width: s.width * side - gap, height: s.height * side - gap,
    }))
  }
  const { rows, columns } = config.layout
  // Fill the printable rectangle, keeping equal gutters and equal outer margins.
  const cellW = (availableW - gap * (columns - 1)) / columns
  const cellH = (availableH - gap * (rows - 1)) / rows
  return Array.from({ length: config.layout.photoCount }, (_, i) => ({
    x: margin + i % columns * (cellW + gap),
    y: margin + Math.floor(i / columns) * (cellH + gap), width: cellW, height: cellH,
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
export function photoDpis(config: EditorConfig, photos: (PhotoItem | null)[]) {
  const page = paper(config)
  const slots = slotsFor(config, page.width, page.height)
  return photos.map((photo, i) => photo && slots[i] ? Math.floor(300 / photoPlacement(photo, slots[i].width, slots[i].height).scale) : null)
}
