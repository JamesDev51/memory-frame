import type { EditorConfig, PhotoItem } from '../types/editor'
export type Snapshot = { config: EditorConfig; photos: PhotoItem[]; placements: (string | null)[] }
export type History = { past: Snapshot[]; present: Snapshot; future: Snapshot[] }
export function updateHistory<K extends keyof Snapshot>(h: History, key: K, next: Snapshot[K], checkpoint: boolean): History {
  if (next === h.present[key]) return h
  return { past: checkpoint ? [...h.past, h.present].slice(-40) : h.past, present: { ...h.present, [key]: next }, future: [] }
}
export function undoHistory(h: History): History {
  return h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h
}
export function redoHistory(h: History): History {
  return h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h
}
