import type { LayoutPreset } from '../types/editor'

export const layoutPresets: LayoutPreset[] = [
  { id: 'grid-4', name: '4장', type: 'grid', photoCount: 4, rows: 2, columns: 2, defaultGap: 'normal' },
  { id: 'grid-6', name: '6장', type: 'grid', photoCount: 6, rows: 2, columns: 3, defaultGap: 'normal' },
  { id: 'grid-9', name: '9장', type: 'grid', photoCount: 9, rows: 3, columns: 3, defaultGap: 'normal' },
  { id: 'grid-12', name: '12장', type: 'grid', photoCount: 12, rows: 3, columns: 4, defaultGap: 'normal' },
  { id: 'grid-16', name: '16장', type: 'grid', photoCount: 16, rows: 4, columns: 4, defaultGap: 'normal' },
  { id: 'grid-20', name: '20장', type: 'grid', photoCount: 20, rows: 4, columns: 5, defaultGap: 'normal' },
]
