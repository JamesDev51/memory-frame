import { getFramePreset, getFrameVariant } from '../presets/frames'
import { heartClipPolygon } from '../utils/render'
import type { CSSProperties, DragEvent } from 'react'
import type { EditorConfig, PhotoItem } from '../types/editor'

interface PosterPreviewProps {
  config: EditorConfig
  photos: PhotoItem[]
  selectedPhotoId?: string | null
  onSelectPhoto?: (id: string) => void
  onMovePhoto?: (from: number, to: number) => void
  onAddPhoto?: () => void
  interactive?: boolean
}

function frameStyle(config: EditorConfig): CSSProperties {
  const frame = getFramePreset(config.frameId)
  const variant = getFrameVariant(config.frameId, config.frameVariantId)

  if (frame.kind === 'dot' && variant.patternColor) {
    return {
      backgroundColor: variant.backgroundColor,
      backgroundImage: `radial-gradient(circle, ${variant.patternColor} 0 10%, transparent 11%)`,
      backgroundSize: '6.2% 4.4%',
    }
  }

  if (frame.kind === 'check' && variant.patternColor) {
    return {
      backgroundColor: variant.backgroundColor,
      backgroundImage: `linear-gradient(90deg, transparent 46%, ${variant.patternColor} 47% 53%, transparent 54%), linear-gradient(transparent 46%, ${variant.patternColor} 47% 53%, transparent 54%)`,
      backgroundSize: '8% 5.7%',
      backgroundPosition: 'center',
    }
  }

  return { backgroundColor: variant.backgroundColor }
}

export default function PosterPreview({
  config,
  photos,
  selectedPhotoId,
  onSelectPhoto,
  onMovePhoto,
  onAddPhoto,
  interactive = true,
}: PosterPreviewProps) {
  const slotCount = config.layout.photoCount
  const slots = Array.from({ length: slotCount })
  const isHeart = config.layout.type === 'heart'
  const gapClass = `gap-${config.gap}`
  const ratio = isHeart ? 1 : config.layout.columns / config.layout.rows

  function handleDragStart(event: DragEvent<HTMLButtonElement>, index: number) {
    event.dataTransfer.setData('text/photo-index', String(index))
    event.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>, targetIndex: number) {
    event.preventDefault()
    const source = Number(event.dataTransfer.getData('text/photo-index'))
    if (Number.isFinite(source) && source !== targetIndex && onMovePhoto) onMovePhoto(source, targetIndex)
  }

  return (
    <div className="poster" style={frameStyle(config)} aria-label="완성본 미리보기">
      <div
        className={`collage ${gapClass} ${isHeart ? 'heart-collage' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${config.layout.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${config.layout.rows}, minmax(0, 1fr))`,
          aspectRatio: String(ratio),
          clipPath: isHeart ? `polygon(${heartClipPolygon()})` : undefined,
        }}
      >
        {slots.map((_, index) => {
          const photo = photos[index]
          if (!photo) {
            return (
              <button
                key={`empty-${index}`}
                type="button"
                className="photo-cell empty-photo"
                onClick={interactive ? onAddPhoto : undefined}
                aria-label="사진 추가"
              >
                <span>+</span>
              </button>
            )
          }

          return (
            <button
              key={photo.id}
              type="button"
              className={`photo-cell ${config.shadow === 'on' ? 'with-shadow' : ''} ${selectedPhotoId === photo.id ? 'selected-photo' : ''}`}
              draggable={interactive}
              onDragStart={(event) => handleDragStart(event, index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, index)}
              onClick={() => interactive && onSelectPhoto?.(photo.id)}
              aria-label={`${index + 1}번째 사진 편집`}
            >
              <img
                src={photo.url}
                alt=""
                draggable={false}
                style={{
                  transform: `translate(-50%, -50%) translate(${photo.offsetX * 24}%, ${photo.offsetY * 24}%) scale(${photo.scale}) rotate(${photo.rotation}deg)`,
                }}
              />
              {interactive && <span className="photo-index">{index + 1}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
