import type { FramePreset } from '../types/editor'

export const framePresets: FramePreset[] = [
  {
    id: 'white',
    label: '화이트',
    kind: 'solid',
    variants: [{ id: 'white', label: '화이트', backgroundColor: '#ffffff', previewClass: 'frame-white' }],
  },
  {
    id: 'ivory',
    label: '아이보리',
    kind: 'solid',
    variants: [{ id: 'ivory', label: '아이보리', backgroundColor: '#f6f0e5', previewClass: 'frame-ivory' }],
  },
  {
    id: 'black',
    label: '블랙',
    kind: 'solid',
    variants: [{ id: 'black', label: '블랙', backgroundColor: '#171717', previewClass: 'frame-black' }],
  },
  {
    id: 'dot',
    label: '도트',
    kind: 'dot',
    variants: [
      { id: 'dot-red', label: '레드', backgroundColor: '#d32f2f', patternColor: '#ffffff', previewClass: 'frame-dot-red' },
      { id: 'dot-black', label: '블랙', backgroundColor: '#111111', patternColor: '#ffffff', previewClass: 'frame-dot-black' },
      { id: 'dot-pink', label: '핑크', backgroundColor: '#f3a7b4', patternColor: '#fffaf8', previewClass: 'frame-dot-pink' },
      { id: 'dot-ivory', label: '아이보리', backgroundColor: '#f5efe3', patternColor: '#222222', previewClass: 'frame-dot-ivory' },
    ],
  },
  {
    id: 'check',
    label: '체크',
    kind: 'check',
    variants: [
      { id: 'check-red', label: '레드', backgroundColor: '#fbf2ee', patternColor: '#c9473a', previewClass: 'frame-check-red' },
      { id: 'check-black', label: '블랙', backgroundColor: '#f6f6f6', patternColor: '#222222', previewClass: 'frame-check-black' },
      { id: 'check-beige', label: '베이지', backgroundColor: '#f4eadb', patternColor: '#b58b62', previewClass: 'frame-check-beige' },
    ],
  },
]

export function getFramePreset(id: string) {
  return framePresets.find((frame) => frame.id === id) ?? framePresets[0]
}

export function getFrameVariant(frameId: string, variantId: string) {
  const frame = getFramePreset(frameId)
  return frame.variants.find((variant) => variant.id === variantId) ?? frame.variants[0]
}
