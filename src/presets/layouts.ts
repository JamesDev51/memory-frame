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
