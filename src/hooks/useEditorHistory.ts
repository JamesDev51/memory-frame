import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react'
import type { EditorConfig, PhotoItem } from '../types/editor'
import { updateHistory, undoHistory, redoHistory, type Snapshot, type History } from '../utils/history'
export function useEditorHistory(initialConfig: EditorConfig) {
  const [history, setHistory] = useState<History>({ past: [], present: { config: initialConfig, photos: [] }, future: [] })
  const group = useRef(false)
  const groupSaved = useRef(false)
  const urls = useRef(new Set<string>())
  const register = (url: string) => urls.current.add(url)
  useEffect(() => () => { urls.current.forEach(url => URL.revokeObjectURL(url)) }, [])
  const update = useCallback(<K extends keyof Snapshot>(key: K, value: SetStateAction<Snapshot[K]>) => {
    // A photo adjustment dialog forms one undo step, including continuous gestures.
    const checkpoint = !group.current || !groupSaved.current
    groupSaved.current = true
    setHistory(h => {
      const next = typeof value === 'function' ? (value as (v: Snapshot[K]) => Snapshot[K])(h.present[key]) : value
      return updateHistory(h, key, next, checkpoint)
    })
  }, [])
  const setConfig = useCallback((v: SetStateAction<EditorConfig>) => update('config', v), [update])
  const setPhotos = useCallback((v: SetStateAction<PhotoItem[]>) => update('photos', v), [update])
  function undo() { setHistory(undoHistory) }
  function redo() { setHistory(redoHistory) }
  function beginGroup() { group.current = true; groupSaved.current = false }
  function endGroup() { group.current = false; groupSaved.current = false }
  function reset() {
    endGroup()
    setHistory({ past: [], present: { config: initialConfig, photos: [] }, future: [] })
    urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear()
  }
  // Dispose images only after they leave both the current document and undo history.
  useEffect(() => {
    const retained = new Set([...history.past, history.present, ...history.future].flatMap(s => s.photos.map(p => p.url)))
    for (const url of urls.current) if (!retained.has(url)) { URL.revokeObjectURL(url); urls.current.delete(url) }
  }, [history])
  return { ...history.present, setConfig, setPhotos, undo, redo, canUndo: !!history.past.length, canRedo: !!history.future.length, beginGroup, endGroup, reset, register }
}
