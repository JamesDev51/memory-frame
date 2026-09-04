import { useRef, useState, type PointerEvent } from 'react'
import type { PhotoItem } from '../types/editor'

interface PhotoAdjusterProps {
  photo: PhotoItem
  index: number
  total: number
  onChange: (patch: Partial<PhotoItem>) => void
  onReplace: (file: File) => void
  onDelete: () => void
  onMove: (direction: -1 | 1) => void
  onClose: () => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export default function PhotoAdjuster({ photo, index, total, onChange, onReplace, onDelete, onMove, onClose }: PhotoAdjusterProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, offsetX: photo.offsetX, offsetY: photo.offsetY }
    setDragging(true)
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    const dx = (event.clientX - dragRef.current.x) / rect.width
    const dy = (event.clientY - dragRef.current.y) / rect.height
    onChange({
      offsetX: clamp(dragRef.current.offsetX + dx * 2.3, -1, 1),
      offsetY: clamp(dragRef.current.offsetY + dy * 2.3, -1, 1),
    })
  }

  function endDrag() {
    dragRef.current = null
    setDragging(false)
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="bottom-sheet photo-adjuster" role="dialog" aria-modal="true" aria-label="사진 위치 조정">
        <div className="sheet-grabber" />
        <div className="sheet-title-row">
          <div>
            <p className="sheet-kicker">사진 {index + 1} / {total}</p>
            <h2>사진 위치를 맞춰주세요</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <div
          className={`adjuster-canvas ${dragging ? 'dragging' : ''}`}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img
            src={photo.url}
            alt="선택한 사진 미리보기"
            draggable={false}
            style={{
              transform: `translate(-50%, -50%) translate(${photo.offsetX * 24}%, ${photo.offsetY * 24}%) scale(${photo.scale}) rotate(${photo.rotation}deg)`,
            }}
          />
          <span className="drag-hint">손가락으로 사진을 움직여보세요</span>
        </div>

        <label className="zoom-control">
          <span>확대</span>
          <input
            type="range"
            min="1"
            max="2.5"
            step="0.02"
            value={photo.scale}
            onChange={(event) => onChange({ scale: Number(event.target.value) })}
          />
        </label>

        <div className="adjuster-actions">
          <button type="button" className="soft-button" disabled={index === 0} onClick={() => onMove(-1)}>← 앞칸</button>
          <button type="button" className="soft-button" disabled={index === total - 1} onClick={() => onMove(1)}>뒷칸 →</button>
          <button type="button" className="soft-button" onClick={() => inputRef.current?.click()}>사진 교체</button>
        </div>
        <input
          ref={inputRef}
          hidden
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onReplace(file)
            event.currentTarget.value = ''
          }}
        />

        <div className="adjuster-footer">
          <button type="button" className="text-danger" onClick={onDelete}>이 사진 삭제</button>
          <button type="button" className="primary-button compact" onClick={onClose}>완료</button>
        </div>
      </section>
    </div>
  )
}
