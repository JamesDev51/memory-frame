import type { FramePreset } from '../types/editor'

export const framePresets: FramePreset[] = [
  { id: 'white', name: 'White', type: 'solid', backgroundColor: '#ffffff', shadowEnabledByDefault: true },
  { id: 'ivory', name: 'Ivory', type: 'solid', backgroundColor: '#f6f0e6', shadowEnabledByDefault: true },
  { id: 'black', name: 'Black', type: 'solid', backgroundColor: '#111111', shadowEnabledByDefault: true },
  { id: 'dot-red', name: 'Red × White', type: 'dot', backgroundColor: '#d43a36', patternColor: '#ffffff', shadowEnabledByDefault: true },
  { id: 'dot-black', name: 'Black × White', type: 'dot', backgroundColor: '#111111', patternColor: '#ffffff', shadowEnabledByDefault: true },
  { id: 'dot-pink', name: 'Pink × White', type: 'dot', backgroundColor: '#e9a8b1', patternColor: '#ffffff', shadowEnabledByDefault: true },
  { id: 'dot-ivory', name: 'Ivory × Black', type: 'dot', backgroundColor: '#f6f0e6', patternColor: '#111111', shadowEnabledByDefault: true },
]
