import { useEffect, useRef, useState } from 'react'
import { paper, slotsFor } from '../utils/geometry'
import { renderToCanvas } from '../utils/render'
import type { EditorConfig, PhotoItem } from '../types/editor'
interface Props {
  config: EditorConfig; photos: (PhotoItem | null)[]; selectedPhotoId?: string | null
  onSelectPhoto?: (id: string) => void
  onAddPhoto?: (index: number) => void; interactive?: boolean
  placementId?: string | null; onPlace?: (id: string, index: number) => void; targetIndex?: number | null
}
export default function PosterPreview({ config, photos, selectedPhotoId, onSelectPhoto, onAddPhoto, placementId, onPlace, targetIndex, interactive = true }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
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
        className={`tile-hit ${photo ? '' : 'empty-photo'} ${photo?.id === selectedPhotoId ? 'selected-photo' : ''} ${placementId ? 'placement-target' : ''} ${dropIndex === i || targetIndex === i ? 'drop-target' : ''}`}
        style={{ left: `${slot.x / width * 100}%`, top: `${slot.y / height * 100}%`, width: `${slot.width / width * 100}%`, height: `${slot.height / height * 100}%` }}
        aria-label={placementId ? `${i + 1}번 칸에 사진 배치` : photo ? `${i + 1}번째 사진 편집` : `${i + 1}번 빈칸 채우기`}
        onClick={() => placementId ? onPlace?.(placementId, i) : photo ? onSelectPhoto?.(photo.id) : onAddPhoto?.(i)} draggable={!!photo}
        onDragStart={e => { if (photo) e.dataTransfer.setData('application/x-memory-frame-photo', photo.id); e.dataTransfer.effectAllowed = 'move' }}
        onDragOver={e => { if (e.dataTransfer.types.includes('application/x-memory-frame-photo')) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropIndex(i) } }}
        onDragLeave={() => setDropIndex(null)} onDrop={e => {
          e.preventDefault(); setDropIndex(null)
          const id = e.dataTransfer.getData('application/x-memory-frame-photo')
          if (id) onPlace?.(id, i)
        }}>

        {photo ? <span className="photo-index">{i + 1}</span> : <span>＋</span>}
      </button>
    })}
  </div>
}
