import type { Snapshot } from './history'
import { getLayoutPreset } from '../presets/layouts'
import type { PhotoItem } from '../types/editor'
export type Placement = { id: string; photoId: string; scale: number; offsetX: number; offsetY: number; rotation: 0 | 90 | 180 | 270; fit: 'cover' | 'contain' }
export const defaultEdit = { scale: 1, offsetX: 0, offsetY: 0, rotation: 0 as const, fit: 'cover' as const }
export function newPlacement(photoId: string): Placement { return { id: crypto.randomUUID(), photoId, ...defaultEdit } }
export function resizePlacements(placements: (Placement | null)[], count: number) {
  return Array.from({length: Math.max(count, placements.length)}, (_, i) => placements[i] ?? null)
}
// Library drops create an independent instance; slot drops swap complete instances.
export function placePhoto(placements: (Placement | null)[], id: string, target: number) {
  if (target < 0 || target >= placements.length) return placements
  const source = placements.findIndex(p => p?.id === id)
  if (source === target) return placements
  const next = [...placements]
  if (source >= 0) { next[source] = next[target]; next[target] = placements[source] }
  else next[target] = newPlacement(id)
  return next
}
export function fillEmpty(placements: (Placement | null)[], photos: PhotoItem[], count = placements.length) {
  const used = new Set(placements.slice(0,count).map(p => p?.photoId))
  const remaining = photos.filter(p => !used.has(p.id)); let index = 0
  return placements.map((p,i) => p || i >= count ? p : remaining[index] ? newPlacement(remaining[index++].id) : null)
}
export function arrangedPhotos(placements: (Placement | null)[], photos: PhotoItem[]) {
  const byId = new Map(photos.map(p => [p.id, p]))
  return placements.map(p => p && byId.has(p.photoId) ? { ...byId.get(p.photoId)!, ...p } : null)
}

export function switchLayoutSnapshot(s: Snapshot, type: 'grid' | 'heart'): Snapshot {
  if (s.config.layout.type === type) return s
  const layouts = {...s.layouts, [s.config.layout.type]:{layout:s.config.layout,placements:s.placements}}
  const saved = layouts[type]
  const layout = saved?.layout ?? getLayoutPreset(type,Math.max(type==='heart'?4:1,s.config.layout.photoCount))
  return {...s,layouts,config:{...s.config,layout},placements:saved?.placements ?? Array(layout.photoCount).fill(null)}
}
