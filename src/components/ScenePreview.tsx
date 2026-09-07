import { useEffect, useRef, useState } from 'react'
import type { EditorConfig, PhotoItem } from '../types/editor'
import { paper } from '../utils/geometry'
import FramePreview, { type FrameFinish } from './FramePreview'
import PosterPreview from './PosterPreview'

export default function ScenePreview({config, photos}: {config: EditorConfig; photos: (PhotoItem | null)[]}) {
  const [open, setOpen] = useState(false)
  const [scene, setScene] = useState<'table' | 'wall'>('table')
  const [finish, setFinish] = useState<FrameFinish>('wood')
  const [failed, setFailed] = useState(false)
  const dialog = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const items = () => Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
    items()[0]?.focus()
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
      if (event.key === 'Tab') {
        const buttons = items(), first = buttons[0], last = buttons.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown',keydown); previous?.focus() }
  }, [open])
  const page = paper(config)
  const objectWidth = Math.min(44, 52 / 1.5 * page.widthMm / page.heightMm)
  return <section className="control-section">
    <div className="control-title"><strong>공간에서 미리보기</strong></div>
    <p className="print-note">포토테이블과 벽에 놓인 모습을 확인해보세요.</p>
    <button type="button" className="soft-button full" disabled={!photos.some(Boolean)} onClick={() => setOpen(true)}>공간 미리보기 열기</button>
    {open && <div className="sheet-backdrop scene-backdrop" onMouseDown={e => e.target === e.currentTarget && setOpen(false)}>
      <section className="bottom-sheet scene-sheet" ref={dialog} role="dialog" aria-modal="true" aria-label="공간 미리보기">
        <div className="sheet-title-row"><h2>이렇게 놓아볼까요?</h2><button type="button" className="icon-button" aria-label="공간 미리보기 닫기" onClick={() => setOpen(false)}>×</button></div>
        <div className="scene-controls">
          <div className="segmented">{(['table','wall'] as const).map(value => <button key={value} type="button" aria-pressed={scene === value} className={scene === value ? 'selected' : ''} onClick={() => { setScene(value); setFailed(false) }}>{value === 'table' ? '웨딩 포토테이블' : '벽걸이 액자'}</button>)}</div>
          <div className="finish-options">{(['black','white','wood'] as const).map(value => <button key={value} type="button" aria-pressed={finish === value} onClick={() => setFinish(value)}>{value === 'black' ? '블랙' : value === 'white' ? '화이트' : '우드'}</button>)}</div>
        </div>
        <div className={`scene-stage scene-${scene}`}>
          <img src={`/scenes/wedding-${scene}.webp`} alt={scene === 'table' ? 'AI로 만든 꽃과 리넨이 있는 웨딩 포토테이블' : 'AI로 만든 밝은 벽과 원목 콘솔 공간'} onError={() => setFailed(true)} />
          <div className="scene-object" style={{width: `${objectWidth}%`}}><FramePreview config={config} finish={finish}><PosterPreview config={config} photos={photos} interactive={false} /></FramePreview></div>
        </div>
        {failed && <p role="alert">배경을 불러오지 못했어요. 잠시 후 다시 열어주세요.</p>}
        <p className="print-note">AI 배경에 현재 완성본을 합성한 분위기 미리보기예요. 실제 액자 크기·조명·설치 비율과는 다를 수 있어요. 사진은 서버에 전송되지 않으며, 인쇄 파일에는 배경과 액자 모형이 포함되지 않아요.</p>
      </section>
    </div>}
  </section>
}
