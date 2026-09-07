import { useEffect, useRef, useState } from 'react'
import { paper, slotsFor } from '../utils/geometry'
import { renderToCanvas } from '../utils/render'
import type { EditorConfig, PhotoItem } from '../types/editor'
interface Props {
  config: EditorConfig; photos: PhotoItem[]; selectedPhotoId?: string | null
  onSelectPhoto?: (id: string) => void; onMovePhoto?: (from: number, to: number) => void
  onAddPhoto?: () => void; interactive?: boolean
}
export default function PosterPreview({ config, photos, selectedPhotoId, onSelectPhoto, onMovePhoto, onAddPhoto, interactive = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState(false)
  const page = paper(config), width = 900, height = width * page.heightMm / page.widthMm
  const slots = slotsFor(config, width, height)
  useEffect(() => {
    let cancelled = false
    setError(false)
    void renderToCanvas(config, photos, width, height, () => cancelled).then(canvas => {
      if (!cancelled && ref.current) {
        ref.current.width = canvas.width; ref.current.height = canvas.height
        ref.current.getContext('2d')?.drawImage(canvas, 0, 0)
      }
      canvas.width = 0; canvas.height = 0
    }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [config, photos, width, height])
  return <div className="poster canvas-poster" style={{ aspectRatio: `${page.widthMm} / ${page.heightMm}` }} aria-label="완성본 미리보기">
    <canvas ref={ref} aria-label="인쇄 미리보기 이미지" />
    {error && <span className="preview-error" role="alert">미리보기를 불러오지 못했어요. 사진을 다시 선택해주세요.</span>}
    {interactive && slots.map((slot, i) => {
      const photo = photos[i]
      return <button key={photo?.id ?? `empty-${i}`} type="button"
        className={`tile-hit ${photo ? '' : 'empty-photo'} ${photo?.id === selectedPhotoId ? 'selected-photo' : ''}`}
        style={{ left: `${slot.x / width * 100}%`, top: `${slot.y / height * 100}%`, width: `${slot.width / width * 100}%`, height: `${slot.height / height * 100}%` }}
        aria-label={photo ? `${i + 1}번째 사진 편집` : '사진 추가'}
        onClick={() => photo ? onSelectPhoto?.(photo.id) : onAddPhoto?.()} draggable={!!photo}
        onDragStart={e => { e.dataTransfer.setData('text/photo-index', String(i)); e.dataTransfer.effectAllowed = 'move' }}
        onDragOver={e => e.preventDefault()} onDrop={e => {
          e.preventDefault(); const value = e.dataTransfer.getData('text/photo-index')
          if (!value) return
          const from = Number(value)
          if (Number.isInteger(from) && from >= 0 && from < photos.length && from !== i) onMovePhoto?.(from, i)
        }}>
        {photo ? <span className="photo-index">{i + 1}</span> : <span>＋</span>}
      </button>
    })}
  </div>
}
