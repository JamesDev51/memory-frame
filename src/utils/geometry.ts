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
  return typeof gap === 'number' ? Math.max(0, Math.min(.08, Number.isFinite(gap) ? gap : .006)) : ({ narrow: .006, normal: .014, wide: .026 }[gap])
}
export function shadowStrength(shadow: EditorConfig['shadow']) {
  return typeof shadow === 'number' ? Math.max(0, Math.min(1, Number.isFinite(shadow) ? shadow / 100 : 0)) : shadow === 'on' ? .5 : 0
}
export function maxGapRatio(config: EditorConfig) {
  const page = paper(config), short = Math.min(page.widthMm, page.heightMm)
  const w = page.widthMm - 2 * safeMarginMm(config), h = page.heightMm - 2 * safeMarginMm(config)
  if (config.layout.type === 'heart') return Math.min(.08, Math.min(w,h) / short * Math.min(...getHeartSlots(config.layout.photoCount).map(s => Math.min(s.width,s.height))) * .7)
  return Math.min(.08, .65 * Math.min(config.layout.columns > 1 ? w / (config.layout.columns - 1) : Infinity, config.layout.rows > 1 ? h / (config.layout.rows - 1) : Infinity) / short)
}
export function effectiveGapRatio(config: EditorConfig) { return Math.min(gapRatio(config.gap), maxGapRatio(config)) }
export function slotsFor(config: EditorConfig, width: number, height: number): Rect[] {
  const gap = Math.min(width, height) * effectiveGapRatio(config)
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
  let cellW = (availableW - gap * (columns - 1)) / columns
  let cellH = (availableH - gap * (rows - 1)) / rows
  if (config.photoStyle === 'polaroid') {
    cellW = Math.min(cellW, cellH / cardRatio(config)); cellH = cellW * cardRatio(config)
  }
  const originX = (width - (cellW * columns + gap * (columns - 1))) / 2
  const originY = (height - (cellH * rows + gap * (rows - 1))) / 2
  return Array.from({ length: config.layout.photoCount }, (_, i) => ({
    x: originX + i % columns * (cellW + gap),
    y: originY + Math.floor(i / columns) * (cellH + gap), width: cellW, height: cellH,
  }))
}
export function cardRatio(config: EditorConfig) { return 1 - (config.cardBorder ?? .0482) + (config.cardBottom ?? .211) }
export function cardRect(config: EditorConfig, slot: Rect): Rect {
  if (config.photoStyle !== 'polaroid') return slot
  const width = Math.min(slot.width, slot.height / cardRatio(config)), height = width * cardRatio(config)
  return {x: slot.x + (slot.width-width)/2, y: slot.y + (slot.height-height)/2, width, height}
}
export function photoRect(config: EditorConfig, slot: Rect): Rect {
  const card = cardRect(config, slot)
  if (config.photoStyle !== 'polaroid') return card
  const inset = card.width * (config.cardBorder ?? .0482), side = card.width - 2 * inset
  return {x:card.x+inset,y:card.y+inset,width:side,height:side}
}
export function photoPlacement(photo: PhotoItem, width: number, height: number) {
  const contain = photo.fit === 'contain'
  const rotated = photo.rotation === 90 || photo.rotation === 270
  const naturalW = rotated ? photo.naturalHeight : photo.naturalWidth, naturalH = rotated ? photo.naturalWidth : photo.naturalHeight
  const base = (contain ? Math.min : Math.max)(width / naturalW, height / naturalH)
  const scale = base * (contain ? 1 : Math.max(1, photo.scale))
  const w = naturalW * scale, h = naturalH * scale
  const maxX = Math.max(0, (w - width) / 2), maxY = Math.max(0, (h - height) / 2)
  const clamp = (n: number) => Math.max(-1, Math.min(1, n))
  return { x: (width - w) / 2 + (contain ? 0 : clamp(photo.offsetX) * maxX), y: (height - h) / 2 + (contain ? 0 : clamp(photo.offsetY) * maxY), width: w, height: h, scale, maxX, maxY }
}
export function photoDpis(config: EditorConfig, photos: (PhotoItem | null)[]) {
  const page = paper(config)
  const slots = slotsFor(config, page.width, page.height)
  return photos.map((photo, i) => photo && slots[i] ? Math.floor(300 / photoPlacement(photo, photoRect(config, slots[i]).width, photoRect(config, slots[i]).height).scale) : null)
}
