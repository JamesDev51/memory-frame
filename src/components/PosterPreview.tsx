import { Fragment, useEffect, useRef, useState } from 'react'
import { paper, slotsFor, cardRect, photoRect, photoPlacement } from '../utils/geometry'
import { renderToCanvas } from '../utils/render'
import type { EditorConfig, PhotoItem } from '../types/editor'
interface Props {
  onAdjust?: (patch: Partial<PhotoItem>) => void; onBegin?: () => void; onEnd?: () => void
  config: EditorConfig; photos: (PhotoItem | null)[]; selectedPhotoId?: string | null
  onSelectPhoto?: (id: string) => void
  onAddPhoto?: (index: number) => void; onRemove?: (index: number) => void; interactive?: boolean
  placementId?: string | null; onPlace?: (id: string, index: number) => void; targetIndex?: number | null
}
export default function PosterPreview({ config, photos, selectedPhotoId, onSelectPhoto, onAddPhoto, onRemove, placementId, onPlace, targetIndex, interactive = true, onAdjust, onBegin, onEnd }: Props) {
  const pan = useRef<{x:number;y:number;ox:number;oy:number;maxX:number;maxY:number}|null>(null)
  const ref = useRef<HTMLCanvasElement>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [error, setError] = useState(false)
  const page = paper(config), width = 900, height = width * page.heightMm / page.widthMm
  const slots = slotsFor(config, width, height)
  useEffect(() => {
    let cancelled = false
    setError(false)
    void renderToCanvas(config, photos, width, height, () => cancelled, interactive).then(canvas => {
      if (!cancelled && ref.current) {
        ref.current.width = canvas.width; ref.current.height = canvas.height
        ref.current.getContext('2d')?.drawImage(canvas, 0, 0)
      }
      canvas.width = 0; canvas.height = 0
    }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [config, photos, width, height, interactive])
  return <div className="poster canvas-poster" style={{ aspectRatio: `${page.widthMm} / ${page.heightMm}` }} aria-label="완성본 미리보기">
    <canvas ref={ref} aria-label="인쇄 미리보기 이미지" />
    {error && <span className="preview-error" role="alert">미리보기를 불러오지 못했어요. 사진을 다시 선택해주세요.</span>}
    {interactive && slots.map((rawSlot, i) => {
      const slot = cardRect(config, rawSlot)
      const photo = photos[i]
      return <Fragment key={i}><button type="button"
        className={`tile-hit ${photo ? '' : 'empty-photo'} ${photo?.id === selectedPhotoId ? 'selected-photo' : ''} ${placementId ? 'placement-target' : ''} ${dropIndex === i || targetIndex === i ? 'drop-target' : ''}`}
        style={{ left: `${slot.x / width * 100}%`, top: `${slot.y / height * 100}%`, width: `${slot.width / width * 100}%`, height: `${slot.height / height * 100}%` }}
        aria-label={placementId ? `${i + 1}번 칸에 사진 배치` : photo ? `${i + 1}번째 사진 편집` : `${i + 1}번 빈칸 채우기`}
        onClick={() => placementId ? onPlace?.(placementId, i) : photo ? onSelectPhoto?.(photo.id) : onAddPhoto?.(i)} draggable={!!photo && photo.id !== selectedPhotoId}
        onPointerDown={e=>{
          if(!photo || photo.id!==selectedPhotoId || placementId || photo.fit==='contain')return
          e.currentTarget.setPointerCapture(e.pointerId);onBegin?.()
          const box=e.currentTarget.getBoundingClientRect(), picture=photoRect(config,rawSlot)
          const p=photoPlacement(photo,picture.width*box.width/slot.width,picture.height*box.height/slot.height)
          pan.current={x:e.clientX,y:e.clientY,ox:photo.offsetX,oy:photo.offsetY,maxX:p.maxX,maxY:p.maxY}
        }}
        onPointerMove={e=>{if(!pan.current)return;const p=pan.current;onAdjust?.({offsetX:p.maxX?Math.max(-1,Math.min(1,p.ox+(e.clientX-p.x)/p.maxX)):0,offsetY:p.maxY?Math.max(-1,Math.min(1,p.oy+(e.clientY-p.y)/p.maxY)):0})}}
        onPointerUp={()=>{pan.current=null;onEnd?.()}} onPointerCancel={()=>{pan.current=null;onEnd?.()}}
        onDragStart={e => { if (photo) e.dataTransfer.setData('application/x-memory-frame-photo', photo.id); e.dataTransfer.effectAllowed = 'move' }}
        onDragOver={e => { if (e.dataTransfer.types.includes('application/x-memory-frame-photo')) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropIndex(i) } }}
        onDragLeave={() => setDropIndex(null)} onDrop={e => {
          e.preventDefault(); setDropIndex(null)
          const id = e.dataTransfer.getData('application/x-memory-frame-photo')
          if (id) onPlace?.(id, i)
        }}>

        {photo ? <span className="photo-index">{i + 1}</span> : <span>＋</span>}
      </button>
      {photo && onRemove && <button type="button" className="tile-remove" aria-label={`${i + 1}번 칸에서 사진 빼기`} title="칸에서 빼기 · 보관함에 유지" style={{ left: `${(slot.x + slot.width) / width * 100}%`, top: `${slot.y / height * 100}%` }} onClick={() => onRemove(i)}>×</button>}
      </Fragment>
    })}
  </div>
}
