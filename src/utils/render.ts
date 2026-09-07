import { getFramePreset, getFrameVariant } from '../presets/frames'
import type { EditorConfig, PhotoItem } from '../types/editor'
import { paper, slotsFor, photoPlacement, shadowStrength, cardRect, photoRect, type Rect } from './geometry'
export { PRINT_SIZES, type PrintSize } from './geometry'

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'))
    image.src = url
  })
}
function gray(color: string) {
  const value = color.replace('#', '')
  const parts = [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16))
  const g = Math.round(parts[0] * .2126 + parts[1] * .7152 + parts[2] * .0722)
  return `rgb(${g},${g},${g})`
}
export function matColor(config: EditorConfig) {
  return config.frameId === 'black' || config.frameVariantId === 'dot-black' ? '#171717' : '#fffaf5'
}
export function drawCard(ctx: CanvasRenderingContext2D, rect: Rect, config: EditorConfig) {
  const {x,y,width,height} = cardRect(config, rect)
  ctx.save()
  const strength = shadowStrength(config.shadow)
  if (strength > 0) {
    ctx.shadowColor = `rgba(25,22,20,${strength * .55})`
    ctx.shadowBlur = width * (.02 + strength * .07)
    ctx.shadowOffsetX = width * strength * .008
    ctx.shadowOffsetY = width * strength * .04
  }
  const background = config.photoStyle === 'polaroid' ? '#ffffff' : matColor(config)
  ctx.fillStyle = config.colorMode === 'all-gray' ? gray(background) : background
  ctx.fillRect(x,y,width,height)
  ctx.restore()
}
export function drawPhoto(ctx: CanvasRenderingContext2D, image: HTMLImageElement, photo: PhotoItem, rect: Rect, config: EditorConfig) {
  drawCard(ctx,rect,config)
  const { x, y, width, height } = photoRect(config, rect)
  ctx.save()
  ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip()
  const p = photoPlacement(photo, width, height)
  // CSS Canvas filter is applied identically to the preview and exported photos.
  if (config.colorMode !== 'color' && !Reflect.has(ctx, 'filter')) {
    const tile = document.createElement('canvas')
    tile.width = Math.max(1, Math.ceil(width)); tile.height = Math.max(1, Math.ceil(height))
    const tileCtx = tile.getContext('2d')!
    tileCtx.drawImage(image, p.x, p.y, p.width, p.height)
    const pixels = tileCtx.getImageData(0, 0, tile.width, tile.height)
    for (let i = 0; i < pixels.data.length; i += 4) {
      const g = Math.round(pixels.data[i] * .2126 + pixels.data[i + 1] * .7152 + pixels.data[i + 2] * .0722)
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = g
    }
    tileCtx.putImageData(pixels, 0, 0)
    ctx.drawImage(tile, x, y, width, height)
    tile.width = 0; tile.height = 0
  } else {
    ctx.filter = config.colorMode === 'color' ? 'none' : 'grayscale(1)'
    ctx.drawImage(image, x + p.x, y + p.y, p.width, p.height)
  }
  ctx.restore()
}
export async function renderToCanvas(config: EditorConfig, photos: (PhotoItem | null)[], width: number, height: number, cancelled = () => false, showEmpty = false) {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('캔버스를 만들 수 없습니다.')
  ctx.imageSmoothingQuality = 'high'
  const frame = getFramePreset(config.frameId), variant = getFrameVariant(config.frameId, config.frameVariantId)
  const color = (c: string) => config.colorMode === 'all-gray' ? gray(c) : c
  ctx.fillStyle = color(variant.backgroundColor); ctx.fillRect(0, 0, width, height)
  if (frame.kind !== 'solid' && variant.patternColor) {
    const size = Math.min(width, height) * (frame.kind === 'dot' ? .062 : .08)
    ctx.fillStyle = color(variant.patternColor)
    ctx.strokeStyle = color(variant.patternColor)
    ctx.lineWidth = size * .07
    for (let y = size / 2; y < height + size; y += size) {
      if (frame.kind === 'check') { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke() }
      else for (let x = size / 2; x < width + size; x += size) { ctx.beginPath(); ctx.arc(x, y, size * .09, 0, Math.PI * 2); ctx.fill() }
    }
    if (frame.kind === 'check') for (let x = size / 2; x < width + size; x += size) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke() }
  }
  const slots = slotsFor(config, width, height)
  try {
    for (let i = 0; i < slots.length; i++) {
      if (cancelled()) break
      const photo = photos[i]
      if (!photo) { if (showEmpty) drawCard(ctx, slots[i], config); continue }
      const image = await loadImage(photo.url)
      if (!cancelled()) drawPhoto(ctx, image, photo, slots[i], config)
    }
    return canvas
  } catch (error) { canvas.width = 0; canvas.height = 0; throw error }
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob), anchor = document.createElement('a')
  anchor.href = url; anchor.download = filename
  document.body.appendChild(anchor); anchor.click(); anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
export async function exportPng(config: EditorConfig, photos: (PhotoItem | null)[], dpi = 300) {
  const page = paper(config, dpi), canvas = await renderToCanvas(config, photos, page.width, page.height)
  try {
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('PNG 파일을 만들지 못했습니다.')
    downloadBlob(blob, `memory-frame-${config.printSize}-${dpi}dpi-${Date.now()}.png`)
  } finally { canvas.width = 0; canvas.height = 0 }
}
export async function exportPdf(config: EditorConfig, photos: (PhotoItem | null)[], dpi = 300) {
  const { jsPDF } = await import('jspdf')
  const page = paper(config, dpi), canvas = await renderToCanvas(config, photos, page.width, page.height)
  try {
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', .96))
    if (!blob) throw new Error('PDF 이미지를 만들지 못했습니다.')
    const bytes = new Uint8Array(await blob.arrayBuffer())
    canvas.width = 0; canvas.height = 0
    const pdf = new jsPDF({ orientation: page.widthMm > page.heightMm ? 'landscape' : 'portrait', unit: 'mm', format: [page.widthMm, page.heightMm], compress: true })
    pdf.addImage(bytes, 'JPEG', 0, 0, page.widthMm, page.heightMm)
    pdf.save(`memory-frame-${config.printSize}-${dpi}dpi-${Date.now()}.pdf`)
  } finally { canvas.width = 0; canvas.height = 0 }
}
