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

const heartRows: Record<number, Array<{ count: number; span: number }>> = {
  4: [
    { count: 2, span: 0.68 },
    { count: 1, span: 0.34 },
    { count: 1, span: 0.22 },
  ],
  6: [
    { count: 2, span: 0.7 },
    { count: 3, span: 0.9 },
    { count: 1, span: 0.24 },
  ],
  9: [
    { count: 2, span: 0.68 },
    { count: 3, span: 0.92 },
    { count: 3, span: 0.72 },
    { count: 1, span: 0.22 },
  ],
  12: [
    { count: 2, span: 0.68 },
    { count: 4, span: 0.96 },
    { count: 3, span: 0.78 },
    { count: 2, span: 0.5 },
    { count: 1, span: 0.2 },
  ],
  16: [
    { count: 2, span: 0.68 },
    { count: 4, span: 0.96 },
    { count: 4, span: 0.92 },
    { count: 3, span: 0.72 },
    { count: 2, span: 0.46 },
    { count: 1, span: 0.2 },
  ],
  20: [
    { count: 2, span: 0.68 },
    { count: 4, span: 0.96 },
    { count: 5, span: 1 },
    { count: 4, span: 0.88 },
    { count: 3, span: 0.66 },
    { count: 2, span: 0.38 },
  ],
}

export function getHeartSlots(photoCount: number): HeartSlot[] {
  const rows = heartRows[photoCount] ?? heartRows[12]
  const rowHeight = 1 / rows.length
  const cellHeight = rowHeight * 0.86
  const slots: HeartSlot[] = []

  rows.forEach((row, rowIndex) => {
    const y = rowIndex * rowHeight + (rowHeight - cellHeight) / 2

    if (rowIndex === 0 && row.count === 2) {
      const width = Math.min(0.28, rowHeight * 1.2)
      const centers = [0.28, 0.72]
      centers.forEach((center) => {
        slots.push({ x: center - width / 2, y, width, height: cellHeight })
      })
      return
    }

    const width = Math.min(row.span / row.count, rowHeight * 1.2)
    const totalWidth = width * row.count
    const startX = 0.5 - totalWidth / 2

    for (let index = 0; index < row.count; index += 1) {
      slots.push({
        x: startX + width * index,
        y,
        width,
        height: cellHeight,
      })
    }
  })

  return slots.slice(0, photoCount)
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
