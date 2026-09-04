import { jsPDF } from 'jspdf'
import { getFramePreset, getFrameVariant } from '../presets/frames'
import { getHeartSlots } from '../presets/layouts'
import type { EditorConfig, PhotoItem } from '../types/editor'

export const PRINT_SIZES = {
  A5: { label: 'A5', widthMm: 148, heightMm: 210, widthPx: 1748, heightPx: 2480, hint: '작은 액자' },
  A4: { label: 'A4', widthMm: 210, heightMm: 297, widthPx: 2480, heightPx: 3508, hint: '일반 액자 · 추천' },
  A3: { label: 'A3', widthMm: 297, heightMm: 420, widthPx: 3508, heightPx: 4961, hint: '큰 액자 / 포스터' },
} as const

export type PrintSize = keyof typeof PRINT_SIZES

const gapFactor = {
  narrow: 0.006,
  normal: 0.014,
  wide: 0.026,
}

const heartGapInset = {
  narrow: 0.004,
  normal: 0.009,
  wide: 0.017,
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'))
    image.src = url
  })
}

function createDotPattern(
  ctx: CanvasRenderingContext2D,
  background: string,
  dotColor: string,
  scale: number,
) {
  const tile = document.createElement('canvas')
  const size = Math.max(26, Math.round(42 * scale))
  tile.width = size
  tile.height = size
  const tileCtx = tile.getContext('2d')!
  tileCtx.fillStyle = background
  tileCtx.fillRect(0, 0, size, size)
  tileCtx.fillStyle = dotColor
  tileCtx.beginPath()
  tileCtx.arc(size * 0.5, size * 0.5, size * 0.09, 0, Math.PI * 2)
  tileCtx.fill()
  return ctx.createPattern(tile, 'repeat')
}

function createCheckPattern(
  ctx: CanvasRenderingContext2D,
  background: string,
  lineColor: string,
  scale: number,
) {
  const tile = document.createElement('canvas')
  const size = Math.max(32, Math.round(58 * scale))
  tile.width = size
  tile.height = size
  const tileCtx = tile.getContext('2d')!
  tileCtx.fillStyle = background
  tileCtx.fillRect(0, 0, size, size)
  tileCtx.strokeStyle = lineColor
  tileCtx.globalAlpha = 0.74
  tileCtx.lineWidth = Math.max(2, size * 0.07)
  tileCtx.beginPath()
  tileCtx.moveTo(size * 0.5, 0)
  tileCtx.lineTo(size * 0.5, size)
  tileCtx.moveTo(0, size * 0.5)
  tileCtx.lineTo(size, size * 0.5)
  tileCtx.stroke()
  tileCtx.globalAlpha = 1
  return ctx.createPattern(tile, 'repeat')
}

function getCollageRect(width: number, height: number, config: EditorConfig) {
  const outerMarginX = width * 0.085
  const outerMarginY = height * 0.072
  const availableW = width - outerMarginX * 2
  const availableH = height - outerMarginY * 2
  const targetRatio = config.layout.type === 'heart' ? 1 : config.layout.columns / config.layout.rows

  let collageW = availableW
  let collageH = collageW / targetRatio
  if (collageH > availableH) {
    collageH = availableH
    collageW = collageH * targetRatio
  }

  return {
    x: (width - collageW) / 2,
    y: (height - collageH) / 2,
    width: collageW,
    height: collageH,
  }
}

function drawPhotoCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  photo: PhotoItem,
  x: number,
  y: number,
  width: number,
  height: number,
  shadow: boolean,
) {
  if (shadow) {
    ctx.save()
    ctx.shadowColor = 'rgba(35, 30, 25, 0.19)'
    ctx.shadowBlur = Math.max(8, width * 0.045)
    ctx.shadowOffsetY = Math.max(3, width * 0.018)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x, y, width, height)
    ctx.restore()
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()

  const baseScale = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const zoom = Math.max(1, photo.scale)
  const drawWidth = image.naturalWidth * baseScale * zoom
  const drawHeight = image.naturalHeight * baseScale * zoom
  const centerX = x + width / 2 + photo.offsetX * width * 0.35
  const centerY = y + height / 2 + photo.offsetY * height * 0.35

  ctx.translate(centerX, centerY)
  ctx.rotate((photo.rotation * Math.PI) / 180)
  ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
  ctx.restore()
}

async function renderToCanvas(config: EditorConfig, photos: PhotoItem[], width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('캔버스를 만들 수 없습니다.')

  const frame = getFramePreset(config.frameId)
  const variant = getFrameVariant(config.frameId, config.frameVariantId)
  const densityScale = width / 700

  ctx.fillStyle = variant.backgroundColor
  ctx.fillRect(0, 0, width, height)

  if (frame.kind === 'dot' && variant.patternColor) {
    const pattern = createDotPattern(ctx, variant.backgroundColor, variant.patternColor, densityScale)
    if (pattern) {
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, width, height)
    }
  }

  if (frame.kind === 'check' && variant.patternColor) {
    const pattern = createCheckPattern(ctx, variant.backgroundColor, variant.patternColor, densityScale)
    if (pattern) {
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, width, height)
    }
  }

  const rect = getCollageRect(width, height, config)
  const rows = config.layout.rows
  const columns = config.layout.columns
  const images = await Promise.all(photos.map((photo) => loadImage(photo.url)))

  if (config.layout.type === 'heart') {
    const slots = getHeartSlots(config.layout.photoCount)
    const inset = heartGapInset[config.gap]

    photos.forEach((photo, index) => {
      const slot = slots[index]
      const image = images[index]
      if (!slot || !image) return

      const x = rect.x + (slot.x + inset) * rect.width
      const y = rect.y + (slot.y + inset) * rect.height
      const cellW = Math.max(1, (slot.width - inset * 2) * rect.width)
      const cellH = Math.max(1, (slot.height - inset * 2) * rect.height)

      drawPhotoCover(ctx, image, photo, x, y, cellW, cellH, config.shadow === 'on')
    })
  } else {
    const gap = width * gapFactor[config.gap]
    const cellW = (rect.width - gap * (columns - 1)) / columns
    const cellH = (rect.height - gap * (rows - 1)) / rows

    photos.forEach((photo, index) => {
      const image = images[index]
      if (!image) return
      const row = Math.floor(index / columns)
      const col = index % columns
      const x = rect.x + col * (cellW + gap)
      const y = rect.y + row * (cellH + gap)
      drawPhotoCover(ctx, image, photo, x, y, cellW, cellH, config.shadow === 'on')
    })
  }

  return canvas
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1200)
}

export async function exportPng(config: EditorConfig, photos: PhotoItem[]) {
  const canvas = await renderToCanvas(config, photos, 2480, 3508)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('PNG 파일을 만들지 못했습니다.')
  downloadBlob(blob, `memory-frame-${Date.now()}.png`)
}

export async function exportPdf(config: EditorConfig, photos: PhotoItem[], size: PrintSize) {
  const spec = PRINT_SIZES[size]
  const canvas = await renderToCanvas(config, photos, spec.widthPx, spec.heightPx)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.94)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [spec.widthMm, spec.heightMm],
    compress: true,
  })
  pdf.addImage(dataUrl, 'JPEG', 0, 0, spec.widthMm, spec.heightMm, undefined, 'FAST')
  pdf.save(`memory-frame-${size.toLowerCase()}-${Date.now()}.pdf`)
}
