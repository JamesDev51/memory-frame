import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { drawPhoto, loadImage } from '../utils/render'
import { photoPlacement } from '../utils/geometry'
import type { EditorConfig, PhotoItem } from '../types/editor'

interface PhotoAdjusterProps {
  config: EditorConfig
  aspectRatio: number
  photo: PhotoItem
  index: number
  total: number
  onChange: (patch: Partial<PhotoItem>) => void
  onReplace: (file: File) => void
  onDelete: () => void
  onUnplace?: () => void
  onMove: (direction: -1 | 1) => void
  onBegin: () => void
  onEnd: () => void
  onClose: () => void
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export default function PhotoAdjuster({ config, aspectRatio, photo, index, total, onChange, onReplace, onDelete, onUnplace, onMove, onClose, onBegin, onEnd }: PhotoAdjusterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let active = true
    void loadImage(photo.url).then(image => {
      if (!active || !canvasRef.current) return
      const canvas = canvasRef.current
      canvas.width = 700; canvas.height = Math.round(700 / aspectRatio)
      const ctx = canvas.getContext('2d')!
      drawPhoto(ctx, image, photo, { x: 0, y: 0, width: canvas.width, height: canvas.height }, { ...config, shadow: 'off', photoStyle: 'plain' })
    }).catch(() => {})
    return () => { active = false }
  }, [photo, config, aspectRatio])
  const inputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const [dragging, setDragging] = useState(false)

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (photo.fit === 'contain') return
    onBegin()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, offsetX: photo.offsetX, offsetY: photo.offsetY }
    setDragging(true)
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    const rect = event.currentTarget.getBoundingClientRect()
    const placement = photoPlacement(photo, rect.width, rect.height)
    onChange({
      offsetX: placement.maxX ? clamp(dragRef.current.offsetX + (event.clientX - dragRef.current.x) / placement.maxX, -1, 1) : 0,
      offsetY: placement.maxY ? clamp(dragRef.current.offsetY + (event.clientY - dragRef.current.y) / placement.maxY, -1, 1) : 0,
    })
  }

  function endDrag() {
    onEnd()
    dragRef.current = null
    setDragging(false)
  }

  return (
    <div className="inline-photo-editor" id="photo-editor">
      <section className="photo-adjuster" role="region" aria-label="사진 위치 조정">

        <div className="sheet-title-row">
          <div>
            <p className="sheet-kicker">{index >= 0 ? `${index + 1}번 칸 · ${total}칸` : '미배치 사진'}</p>
            <h2>전체 배치를 보면서 조정하세요</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="닫기">×</button>
        </div>

        <div
          className={`adjuster-canvas ${dragging ? 'dragging' : ''}`}
          style={{ aspectRatio, width: `min(100%, ${240 * aspectRatio}px)` }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <canvas ref={canvasRef} aria-label="선택한 사진 미리보기" />
          <span className="drag-hint">{photo.fit === 'contain' ? '사진 전체를 보여주고 있어요' : '사진을 움직여 위치를 맞춰보세요'}</span>
        </div>

        <div className="segmented fit-controls" aria-label="사진 맞춤">
          <button type="button" className={photo.fit === 'cover' ? 'selected' : ''} onClick={() => onChange({ fit: 'cover', scale: 1, offsetX: 0, offsetY: 0 })}>꽉 채우기</button>
          <button type="button" className={photo.fit === 'contain' ? 'selected' : ''} onClick={() => onChange({ fit: 'contain', scale: 1, offsetX: 0, offsetY: 0 })}>사진 전체 보이기</button>
        </div>
        <label className="zoom-control">
          <span>확대 · {photo.scale.toFixed(2)}배</span>
          <input
            type="range"
            disabled={photo.fit === 'contain'}
            min="1"
            max="3"
            step="0.01"
            aria-label="사진 확대"
            onPointerDown={onBegin} onPointerUp={onEnd} onPointerCancel={onEnd} onBlur={onEnd}
            value={photo.scale}
            onChange={(event) => onChange({ scale: Number(event.target.value) })}
          />
        </label>

        <div className="segmented"><button type="button" onClick={()=>onChange({rotation:((photo.rotation+270)%360) as PhotoItem['rotation'],offsetX:0,offsetY:0})}>↶ 왼쪽 90°</button><button type="button" onClick={()=>onChange({rotation:((photo.rotation+90)%360) as PhotoItem['rotation'],offsetX:0,offsetY:0})}>↷ 오른쪽 90°</button></div>
        <button type="button" className="reset-link" onClick={() => onChange({ scale: 1, offsetX: 0, offsetY: 0, rotation: 0 })}>사진 위치 초기화</button>
        <div className="adjuster-actions">
          <button type="button" className="soft-button" disabled={index <= 0} onClick={() => onMove(-1)}>← 앞칸</button>
          <button type="button" className="soft-button" disabled={index < 0 || index === total - 1} onClick={() => onMove(1)}>뒷칸 →</button>
          <button type="button" className="soft-button" onClick={() => inputRef.current?.click()}>새 파일로 교체</button>
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
          {onUnplace ? <button type="button" className="text-danger" onClick={onUnplace}>이 칸에서 빼기</button> : <button type="button" className="text-danger" onClick={onDelete}>보관함에서 삭제</button>}
          <button type="button" className="primary-button compact" onClick={onClose}>완료</button>
        </div>
      </section>
    </div>
  )
}
