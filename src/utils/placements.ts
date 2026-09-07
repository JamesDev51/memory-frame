import type { PhotoItem } from '../types/editor'
export function resizePlacements(placements: (string | null)[], count: number) {
  return Array.from({length: count}, (_, i) => placements[i] ?? null)
}
export function placePhoto(placements: (string | null)[], id: string, target: number) {
  if (target < 0 || target >= placements.length) return placements
  const source = placements.indexOf(id)
  if (source === target) return placements
  const next = [...placements]
  if (source >= 0) next[source] = next[target]
  next[target] = id
  return next
}
export function fillEmpty(placements: (string | null)[], photos: PhotoItem[]) {
  const used = new Set(placements.filter(Boolean))
  const remaining = photos.filter(p => !used.has(p.id)).map(p => p.id)
  let index = 0
  return placements.map(id => id ?? remaining[index++] ?? null)
}
export function arrangedPhotos(placements: (string | null)[], photos: PhotoItem[]) {
  const byId = new Map(photos.map(p => [p.id, p]))
  return placements.map(id => id ? byId.get(id) ?? null : null)
}
