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

// Wider shoulders and progressively smaller lower tiles create a compact heart.
// Every tile remains square: no photo is clipped by a global silhouette.
const heartRows: Record<number, Array<{ centers: number[]; size: number }>> = {
  4: [{ centers: [-.75, .75], size: 1 }, { centers: [0], size: 1.1 }, { centers: [0], size: .55 }],
  6: [{ centers: [-.85, .85], size: 1.15 }, { centers: [-1, 0, 1], size: 1 }, { centers: [0], size: .7 }],
  9: [{ centers: [-1, 1], size: 1.2 }, { centers: [-1.5, -.5, .5, 1.5], size: 1 }, { centers: [-.45, .45], size: .9 }, { centers: [0], size: .6 }],
  12: [{ centers: [-1, 1], size: 1.2 }, { centers: [-1.5, -.5, .5, 1.5], size: 1 }, { centers: [-.9, 0, .9], size: .9 }, { centers: [-.35, .35], size: .7 }, { centers: [0], size: .45 }],
  16: [{ centers: [-1.5, -.5, .5, 1.5], size: .9 }, { centers: [-2, -1, 0, 1, 2], size: 1 }, { centers: [-1.35, -.45, .45, 1.35], size: .9 }, { centers: [-.375, .375], size: .75 }, { centers: [0], size: .5 }],
  20: [{ centers: [-1.35, -.45, .45, 1.35], size: .85 }, { centers: [-2.125, -1.275, -.425, .425, 1.275, 2.125], size: .85 }, { centers: [-1.275, -.425, .425, 1.275], size: .85 }, { centers: [-.7, 0, .7], size: .7 }, { centers: [-.275, .275], size: .55 }, { centers: [0], size: .4 }],
}

export function getHeartSlots(photoCount: number): HeartSlot[] {
  const rows = heartRows[photoCount] ?? heartRows[12]
  const slots: HeartSlot[] = []
  let y = 0
  rows.forEach((row, r) => {
    const notch = r === 0 && row.centers.length === 4 ? .22 : 0
    row.centers.forEach(center => slots.push({
      x: center - row.size / 2, y: y + (notch && Math.abs(center) < 1 ? notch : 0), width: row.size, height: row.size,
    }))
    y += row.size + notch
  })
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
