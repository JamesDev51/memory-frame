import type { ReactNode } from 'react'
import { paper } from '../utils/geometry'
import type { EditorConfig } from '../types/editor'
export type FrameFinish = 'black' | 'white' | 'wood'
export default function FramePreview({config, finish, children}: {config: EditorConfig; finish: FrameFinish | 'paper'; children: ReactNode}) {
  const page = paper(config)
  return <div className={`frame-proof ${finish === 'paper' ? 'paper-proof' : `finish-${finish}`}`}>
    {children}
    {finish !== 'paper' && config.printUse === 'frame' && <svg className="frame-overlap" viewBox={`0 0 ${page.widthMm} ${page.heightMm}`} preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width={page.widthMm} height={page.heightMm} fill="none" stroke="currentColor" strokeWidth={config.frameOverlapMm * 2} /></svg>}
  </div>
}
