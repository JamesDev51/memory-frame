import type { LayoutPreset, LayoutType } from '../types/editor'

const gridShapes: Record<number, [number, number]> = {
  4: [2, 2],
  6: [2, 3],
  9: [3, 3],
  12: [3, 4],
  16: [4, 4],
  20: [4, 5],
}

export const PHOTO_COUNTS = [4, 6, 9, 12, 16, 20]

export interface HeartSlot {
  x: number
  y: number
  width: number
  height: number
}

// Square tiles: spaced lobes followed by a broad middle and taper.
const heartRows: Record<number, number[][]> = {
  4: [[-1, 1], [0], [0]],
  6: [[-1, 1], [-1, 0, 1], [0]],
  9: [[-1, 1], [-1.5, -.5, .5, 1.5], [-.5, .5], [0]],
  12: [[-1, 1], [-1.5, -.5, .5, 1.5], [-1, 0, 1], [-.5, .5], [0]],
  16: [[-1.5, -.5, 1.5, .5], [-2, -1, 0, 1, 2], [-1.5, -.5, .5, 1.5], [-.5, .5], [0]],
  20: [[-1.5, -.5, .5, 1.5], [-2, -1, 0, 1, 2], [-2, -1, 0, 1, 2], [-1, 0, 1], [-.5, .5], [0]],
}

export function getHeartSlots(photoCount: number): HeartSlot[] {
  const rows = heartRows[photoCount] ?? heartRows[12]
  const units = Math.max(rows.length, ...rows.map(row => Math.max(...row) - Math.min(...row) + 1))
  const pitch = 1 / units
  const slots = rows.flatMap((row, r) => row.slice().sort((a, b) => a - b).map(c => {
    // Lift the outer lobe tiles for larger compositions to create a central notch.
    const lift = r === 0 && photoCount >= 16 && Math.abs(c) > 1 ? .28 : 0
    const side = photoCount === 4 && r === 2 ? .68 : 1
    return {
      x: .5 + (c - side / 2) * pitch,
      y: (r + .3 - lift + (1 - side) / 2) * pitch,
      width: side * pitch,
      height: side * pitch,
    }
  }))
  const left = Math.min(...slots.map(s => s.x)), top = Math.min(...slots.map(s => s.y))
  const w = Math.max(...slots.map(s => s.x + s.width)) - left
  const h = Math.max(...slots.map(s => s.y + s.height)) - top
  const extent = Math.max(w, h)
  return slots.map(s => ({ x: (s.x - left + (extent - w) / 2) / extent, y: (s.y - top + (extent - h) / 2) / extent, width: s.width / extent, height: s.height / extent }))
}

export function getLayoutPreset(type: LayoutType, photoCount: number): LayoutPreset {
  const [rows, columns] = gridShapes[photoCount] ?? [3, 3]
  return {
    id: `${type}-${photoCount}`,
    type,
    photoCount,
    rows,
    columns,
    label: type === 'heart' ? `하트 · ${photoCount}장` : `${columns} × ${rows} · ${photoCount}장`,
  }
}

export const layoutOptions = {
  grid: PHOTO_COUNTS.map((count) => getLayoutPreset('grid', count)),
  heart: PHOTO_COUNTS.map((count) => getLayoutPreset('heart', count)),
}
