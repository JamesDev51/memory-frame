import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorHistory } from './hooks/useEditorHistory'
import { paper, slotsFor, photoDpis, effectiveGapRatio, maxGapRatio, shadowStrength } from './utils/geometry'
import ScenePreview from './components/ScenePreview'
import PhotoLibrary from './components/PhotoLibrary'
import FramePreview, { type FrameFinish } from './components/FramePreview'
import { arrangedPhotos, placePhoto, resizePlacements } from './utils/placements'
import PosterPreview from './components/PosterPreview'
import PhotoAdjuster from './components/PhotoAdjuster'
import { framePresets, getFramePreset } from './presets/frames'
import { getHeartSlots, getLayoutPreset, PHOTO_COUNTS, HEART_PHOTO_COUNTS } from './presets/layouts'
import type { EditorConfig, LayoutType, PhotoItem } from './types/editor'
import { exportPdf, exportPng, PRINT_SIZES, type PrintSize } from './utils/render'

type Step = 'home' | 'layout' | 'count' | 'editor'

const initialConfig: EditorConfig = {
  layout: getLayoutPreset('grid', 4),
  gap: 'narrow',
  frameId: 'white',
  frameVariantId: 'white',
  shadow: 'off',
  printSize: 'A4',
  orientation: 'portrait',
  colorMode: 'color',
  customWidthMm: 210, customHeightMm: 297,
  printUse: 'frame', mat: 'minimal', frameOverlapMm: 5,
}

function loadDimensions(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('지원하지 않는 사진 형식입니다.'))
    image.src = url
  })
}

async function fileToPhoto(file: File): Promise<PhotoItem> {
  const url = URL.createObjectURL(file)
  try {
    const dimensions = await loadDimensions(url)
    return {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      file,
      url,
      naturalWidth: dimensions.width,
      naturalHeight: dimensions.height,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      rotation: 0,
      fit: 'cover',
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

function LayoutThumbnail({ type }: { type: LayoutType }) {
  if (type === 'heart') {
    return (
      <div className="layout-thumb heart-thumb" aria-hidden="true">
        {getHeartSlots(12).map((slot, index) => <i key={index} style={{ position: 'absolute', left: `${slot.x * 100}%`, top: `${slot.y * 100}%`, width: `${slot.width * 100 - 2}%`, height: `${slot.height * 100 - 2}%` }} />)}
      </div>
    )
  }
  return (
    <div className="layout-thumb grid-thumb" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, index) => <i key={index} />)}
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState<Step>('home')
  const history = useEditorHistory(initialConfig)
  const { config, photos, placements, setConfig, setPhotos, setPlacements } = history
  const arranged = useMemo(() => arrangedPhotos(placements, photos), [placements, photos])
  const placedCount = arranged.filter(Boolean).length
  const [placementId, setPlacementId] = useState<string | null>(null)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const [frameFinish, setFrameFinish] = useState<FrameFinish | 'paper'>('black')
  const previewRef = useRef<HTMLDivElement>(null)
  const [pendingExport, setPendingExport] = useState<'png' | 'pdf' | null>(null)
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [exportDpi, setExportDpi] = useState(300)
  const [exportError, setExportError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const editorInputRef = useRef<HTMLInputElement>(null)




  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!saveOpen) return
    const previous = document.activeElement as HTMLElement | null
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([hidden]), select, summary, [tabindex="0"]') ?? []).filter(el => el.getClientRects().length)
    focusable()[0]?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function keydown(event: KeyboardEvent) {
      if (document.querySelector('.busy-overlay')) return
      if (event.key === 'Escape') {
        event.preventDefault()
        setSaveOpen(false)
      }
      if (event.key === 'Tab') {
        const items = focusable(), first = items[0], last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus() }
  }, [saveOpen])

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId) ?? null,
    [photos, selectedPhotoId],
  )
  const selectedIndex = selectedPhoto ? placements.indexOf(selectedPhoto.id) : -1
  const currentFrame = getFramePreset(config.frameId)

  function chooseLayout(type: LayoutType) {
    const count = type === 'heart' ? 12 : 4
    history.beginGroup()
    setConfig((current) => ({ ...current, layout: getLayoutPreset(type, count), mat: type === 'grid' ? 'minimal' : 'normal', gap: type === 'grid' ? 'narrow' : 'normal' }))
    setPlacements(resizePlacements(placements, count))
    history.endGroup()
    setStep('count')
  }

  function chooseCount(count: number) {
    setPlacements(resizePlacements(placements, count))
    setConfig((current) => ({ ...current, layout: getLayoutPreset(current.layout.type, count) }))
    setStep('editor')
  }

  async function readFiles(fileList: FileList | null, mode: 'replace-all' | 'append') {
    if (!fileList?.length) return
    const files = Array.from(fileList)
    setBusy('사진을 준비하고 있어요')
    try {
      const next: PhotoItem[] = []
      let failed = 0
      // Decode in small batches so a large gallery selection does not decode all originals at once.
      for (let i = 0; i < files.length; i += 4) {
        const results = await Promise.allSettled(files.slice(i, i + 4).map(fileToPhoto))
        results.forEach(result => { if (result.status === 'fulfilled') next.push(result.value); else failed++ })
        setBusy(`사진을 준비하고 있어요 · ${Math.min(i + 4, files.length)} / ${files.length}`)
      }
      if (!next.length) { setToast('사진을 불러오지 못했어요. JPG, PNG, WEBP 사진을 선택해주세요.'); return }
      next.forEach(photo => history.register(photo.url))
      const all = mode === 'replace-all' ? next : [...photos, ...next]
      const empty = mode === 'replace-all' ? Array(config.layout.photoCount).fill(null) : placements
      history.beginGroup()
      setPhotos(all)
      setPlacements(empty)
      history.endGroup()
      setStep('editor')
      setTargetIndex(null); setPlacementId(null)
      setToast(failed ? `${next.length}장을 추가했어요. 읽지 못한 ${failed}장은 다른 형식으로 다시 선택해주세요.` : `${next.length}장을 추가했어요. 사진관리에서 원하는 칸에 직접 배치해주세요.`)
    } catch {
      setToast('일부 사진을 불러오지 못했어요. JPG, PNG, WEBP 사진을 사용해주세요.')
    } finally {
      setBusy(null)
    }
  }

  function changePhotoCount(count: number) {
    if (count === config.layout.photoCount) return
    history.beginGroup()
    setPlacements(resizePlacements(placements, count))
    setConfig(current => ({ ...current, layout: getLayoutPreset(current.layout.type, count) }))
    history.endGroup()
    setPlacementId(null); setTargetIndex(null)
    if (count < config.layout.photoCount) setToast('줄어든 칸의 사진은 사진관리에 보관했어요.')
  }

  function swapOrientation() {
    if (config.layout.rows === config.layout.columns || config.layout.type === 'heart') return
    setConfig((current) => ({
      ...current,
      layout: {
        ...current.layout,
        rows: current.layout.columns,
        columns: current.layout.rows,
        label: `${current.layout.rows} × ${current.layout.columns} · ${current.layout.photoCount}장`,
      },
    }))
  }

  function assignPhoto(id: string, index: number) {
    if (!photos.some(photo => photo.id === id)) return
    setPlacements(current => placePhoto(current, id, index))
    setPlacementId(null); setTargetIndex(null)
    setToast(`${index + 1}번 칸에 배치했어요.`)
  }
  function selectForPlacement(id: string) {
    if (targetIndex !== null) { assignPhoto(id, targetIndex); return }
    setPlacementId(current => current === id ? null : id)
    if (window.innerWidth <= 900) previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  function chooseEmptySlot(index: number) {
    setTargetIndex(index); setPlacementId(null)
    if (!photos.length) { editorInputRef.current?.click(); return }
    if (window.innerWidth <= 900) document.getElementById('photo-library')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  function removeFromLibrary(id: string) {
    if (id === selectedPhotoId) setSelectedPhotoId(null)
    history.beginGroup()
    setPlacements(current => current.map(value => value === id ? null : value))
    setPhotos(current => current.filter(photo => photo.id !== id))
    history.endGroup()
    setPlacementId(null); setTargetIndex(null)
    setToast('보관함에서 지웠어요. 실행 취소로 복원할 수 있어요.')
  }
  function unplaceSelected() {
    if (!selectedPhotoId) return
    setPlacements(current => current.map(id => id === selectedPhotoId ? null : id))
    closePhoto()
  }

  function patchSelectedPhoto(patch: Partial<PhotoItem>) {
    if (!selectedPhotoId) return
    setPhotos((current) => current.map((photo) => photo.id === selectedPhotoId ? { ...photo, ...patch } : photo))
  }

  async function replaceSelectedPhoto(file: File) {
    if (!selectedPhoto) return
    setBusy('사진을 바꾸고 있어요')
    try {
      const replacement = await fileToPhoto(file)
      history.register(replacement.url)
      setPhotos((current) => current.map((photo) => photo.id === selectedPhoto.id ? { ...replacement, id: selectedPhoto.id } : photo))
    } catch {
      setToast('이 사진은 불러올 수 없어요.')
    } finally {
      setBusy(null)
    }
  }

  function deleteSelectedPhoto() {
    if (!selectedPhoto) return
    removeFromLibrary(selectedPhoto.id)
    closePhoto()
  }
  function moveSelected(direction: -1 | 1) {
    if (!selectedPhotoId || selectedIndex < 0) return
    const target = selectedIndex + direction
    if (target < 0 || target >= placements.length) return
    setPlacements(current => placePhoto(current, selectedPhotoId, target))
  }

  function selectFrame(frameId: string) {
    const frame = getFramePreset(frameId)
    setConfig((current) => ({ ...current, frameId, frameVariantId: frame.variants[0].id }))
  }

  function openPhoto(id: string) { history.endGroup(); setPlacementId(null); setTargetIndex(null); history.beginGroup(); setSelectedPhotoId(id); if (window.innerWidth <= 900) previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  function closePhoto() { history.endGroup(); setSelectedPhotoId(null) }

  async function handleExport(format: 'png' | 'pdf', allowEmpty = false) {
    if (!placedCount) { setExportError('사진을 한 칸 이상 배치해주세요.'); return }
    const empty = config.layout.photoCount - placedCount
    if (empty > 0 && !allowEmpty) { setPendingExport(format); return }
    setPendingExport(null)
    setExportError(null)
    setBusy(`${config.printSize} ${format.toUpperCase()}를 만들고 있어요`)
    try {
      // Let the busy state paint before allocating a large print canvas.
      await new Promise(resolve => setTimeout(resolve, 50))
      if (format === 'png') await exportPng(config, arranged, exportDpi)
      else await exportPdf(config, arranged, exportDpi)
      setToast('파일 저장을 시작했어요. 다운로드 목록을 확인해주세요.')
    } catch {
      setExportError('저장하지 못했어요. 편집 내용은 그대로예요. 아래에서 150 DPI로 바꾸거나 작은 용지로 다시 시도해주세요.')
    } finally { setBusy(null) }
  }

  function resetAll() {
    const ok = !photos.length || window.confirm('현재 사진과 설정을 모두 지우고 처음으로 돌아갈까요?')
    if (!ok) return
    history.reset()
    setSelectedPhotoId(null)
    setAdvancedOpen(false)
    setSaveOpen(false)
    setExportError(null)
    setExportDpi(300)
    setPlacementId(null); setTargetIndex(null); setPendingExport(null)
    setStep('home')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button type="button" className="brand" onClick={resetAll} aria-label="Memory Frame 홈">
          <span className="brand-mark">M</span>
          <span>Memory Frame</span>
        </button>
        {step === 'editor' && (
          <div className="top-actions"><button type="button" className="soft-button" onClick={() => document.getElementById('photo-library')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>사진관리</button><button type="button" className="top-save" onClick={() => setSaveOpen(true)}>저장하기</button></div>
        )}
      </header>

      {step === 'home' && (
        <section className="home-screen">
          <div className="hero-copy">
            <span className="eyebrow">FREE PHOTO FRAME MAKER</span>
            <h1><span className="headline-line">사진만 고르면,</span><span className="headline-line"><span className="headline-phrase">예쁜 한 장이</span>{' '}<span className="headline-phrase">완성돼요.</span></span></h1>
            <p>복잡한 디자인은 필요 없어요. 모양과 프레임만 고르고 사진을 넣으면 끝.</p>
            <button type="button" className="primary-button hero-cta" onClick={() => setStep('layout')}>무료로 만들기</button>
            <div className="privacy-note"><span>✓</span> 사진은 서버에 업로드되지 않아요</div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="sample-poster sample-back"><div className="sample-grid pink-grid" /></div>
            <div className="sample-poster sample-front"><div className="sample-grid photo-grid">{Array.from({ length: 9 }).map((_, i) => <i key={i} />)}</div></div>
            <div className="sample-sticker">♥</div>
          </div>

          <div className="home-points">
            <article><strong>01</strong><h3>모양 고르기</h3><p>그리드 또는 하트, 딱 필요한 두 가지부터.</p></article>
            <article><strong>02</strong><h3>사진 넣기</h3><p>사진을 보관함에 넣고 원하는 칸에 배치해요.</p></article>
            <article><strong>03</strong><h3>바로 저장</h3><p>고화질 PNG와 A5부터 A2까지 PDF로 저장해요.</p></article>
          </div>
        </section>
      )}

      {step !== 'home' && step !== 'editor' && (
        <section className="flow-screen">
          <button
            type="button"
            className="back-button"
            onClick={() => setStep(step === 'layout' ? 'home' : step === 'count' ? 'layout' : 'count')}
          >← 이전</button>
          <div className="progress-row">
            {['layout', 'count'].map((item, index) => (
              <span key={item} className={item === step ? 'active' : ['layout', 'count'].indexOf(step) > index ? 'done' : ''} />
            ))}
          </div>

          {step === 'layout' && (
            <div className="flow-content">
              <p className="step-label">1 / 2</p>
              <h2>어떤 모양으로 만들까요?</h2>
              <p className="step-desc">사진을 넣은 뒤에도 바꿀 수 있어요.</p>
              <div className="layout-cards">
                <button type="button" className="layout-card" onClick={() => chooseLayout('grid')}>
                  <LayoutThumbnail type="grid" />
                  <strong>그리드</strong>
                  <span>깔끔하고 정돈된 배치</span>
                </button>
                <button type="button" className="layout-card" onClick={() => chooseLayout('heart')}>
                  <LayoutThumbnail type="heart" />
                  <strong>하트</strong>
                  <span>사진으로 만드는 하트 모양</span>
                </button>
              </div>
            </div>
          )}

          {step === 'count' && (
            <div className="flow-content compact-flow">
              <p className="step-label">2 / 2</p>
              <h2>사진을 몇 장 넣을까요?</h2>
              <p className="step-desc">작은 액자일수록 사진을 적게 넣으면 얼굴이 잘 보여요.</p>
              <p className="print-note">그리드 추천 · A5 1~4장 / A4 4~6장 / A3 6~12장</p>
              {config.layout.type === 'heart' && <p className="print-note">12장 이상을 추천해요. 4·6장은 단순한 하트 배치예요.</p>}
              <div className="count-grid">
                {(config.layout.type === 'heart' ? HEART_PHOTO_COUNTS : PHOTO_COUNTS).map((count) => {
                  const preset = getLayoutPreset(config.layout.type, count)
                  return (
                    <button key={count} type="button" className="count-button" onClick={() => chooseCount(count)}>
                      {config.layout.type === 'heart' && <span className="count-heart" aria-hidden="true">{getHeartSlots(count).map((slot, i) => <i key={i} style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%`, width: `${slot.width * 100 - 2}%`, height: `${slot.height * 100 - 2}%` }} />)}</span>}
                      <strong>{count}<small>장</small></strong>
                      <span>{config.layout.type === 'heart' ? (count >= 12 ? '하트 추천' : '심플 하트') : `${preset.columns} × ${preset.rows}`}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}


        </section>
      )}

      {step === 'editor' && (
        <section className={`editor-screen ${selectedPhoto ? 'editing-photo' : ''}`} onPointerDownCapture={event => { if (!(event.target as HTMLElement).closest('.photo-adjuster')) history.endGroup() }} onFocusCapture={event => { if (!(event.target as HTMLElement).closest('.photo-adjuster')) history.endGroup() }}>
          <div className="preview-column">
            <div className="editor-heading">
              <div><p className="step-label">미리보기</p><h2>이미 거의 다 됐어요.</h2></div>
              <span className="local-badge">🔒 기기에서만 편집 중</span>
            </div>
            <div className="proof-toolbar">
              <div className="segmented"><button type="button" className={frameFinish === 'paper' ? 'selected' : ''} onClick={() => setFrameFinish('paper')}>인쇄물 보기</button><button type="button" className={frameFinish !== 'paper' ? 'selected' : ''} onClick={() => setFrameFinish('black')}>액자에 넣어 보기</button></div>
              {frameFinish !== 'paper' && <div className="finish-options" aria-label="미리보기 액자 색상">{(['black', 'white', 'wood'] as const).map(finish => <button type="button" key={finish} aria-pressed={frameFinish === finish} onClick={() => setFrameFinish(finish)}>{finish === 'black' ? '블랙' : finish === 'white' ? '화이트' : '우드'}</button>)}</div>}
            </div>
            {placementId && <div className="placement-message" role="status">넣을 칸을 눌러주세요. 이미 찬 칸도 바꿀 수 있어요.<button type="button" onClick={() => setPlacementId(null)}>취소</button></div>}
            <div className="preview-stage" ref={previewRef} style={{ '--paper-aspect': paper(config).widthMm / paper(config).heightMm } as import('react').CSSProperties}>
              <FramePreview config={config} finish={frameFinish}>
              <PosterPreview
                config={config}
                photos={arranged}
                selectedPhotoId={selectedPhotoId}
                onSelectPhoto={openPhoto}
                onPlace={assignPhoto}
                onRemove={index => { const id = placements[index]; setPlacements(current => current.map((value, i) => i === index ? null : value)); if (id === selectedPhotoId) closePhoto(); setToast('칸에서 뺐어요. 사진은 보관함에 남아 있어요.') }}
                placementId={placementId}
                targetIndex={targetIndex}
                onAddPhoto={chooseEmptySlot}
              />
              </FramePreview>
            </div>
      {selectedPhoto && (
        <PhotoAdjuster
          key={selectedPhoto.id}
          config={config}
          aspectRatio={(() => { const page = paper(config); const slot = slotsFor(config, page.width, page.height)[selectedIndex]; return slot ? slot.width / slot.height : 1 })()}
          photo={selectedPhoto}
          index={selectedIndex}
          total={placements.length}
          onChange={patchSelectedPhoto}
          onReplace={(file) => void replaceSelectedPhoto(file)}
          onDelete={deleteSelectedPhoto}
          onUnplace={selectedIndex >= 0 ? unplaceSelected : undefined}
          onMove={moveSelected}
          onClose={closePhoto}
        />
      )}

            <p className="preview-help">{frameFinish === 'paper' ? '사진을 눌러 편집하거나 끌어서 자리를 바꾸세요.' : '액자 외형은 미리보기예요. 저장 파일에는 인쇄할 종이만 담겨요.'}</p>
            <div className="history-controls">
              <button type="button" className="soft-button" disabled={!history.canUndo} onClick={() => { history.undo(); setPlacementId(null); setTargetIndex(null) }}>↶ 실행 취소</button>
              <button type="button" className="soft-button" disabled={!history.canRedo} onClick={() => { history.redo(); setPlacementId(null); setTargetIndex(null) }}>↷ 다시 실행</button>
            </div>

          </div>

          <div className="library-column">
            {targetIndex !== null && <p className="placement-message" role="status">{targetIndex + 1}번 칸에 넣을 사진을 골라주세요.<button type="button" onClick={() => setTargetIndex(null)}>취소</button></p>}
            <PhotoLibrary photos={photos} placements={placements} selectedId={placementId}
              onAdd={() => editorInputRef.current?.click()} onSelect={selectForPlacement} onEdit={openPhoto} onRemove={removeFromLibrary}
              onCancel={() => setPlacementId(null)} />
          </div>

          <aside className="control-panel">
            <ScenePreview config={config} photos={arranged} />
            <section className="control-section">
              <div className="control-title"><strong>포토테이블 액자용</strong></div>
              <p className="print-note">흰 배경 · 인쇄 그림자 없음 · 좁은 간격 · 액자 안전 여백</p>
              <button type="button" className="soft-button full" onClick={() => { closePhoto(); setConfig(c => ({ ...c, frameId: 'white', frameVariantId: 'white', shadow: 'off', gap: 'narrow', mat: 'minimal', printUse: 'frame' })) }}>추천 스타일 적용</button>
            </section>
            <section className="control-section">
              <div className="control-title"><strong>종이 배경</strong><span>인쇄되는 색상과 무늬</span></div>
              <div className="frame-row">
                {framePresets.map((frame) => {
                  const variant = frame.variants[0]
                  return (
                    <button
                      type="button"
                      key={frame.id}
                      className={`frame-option ${config.frameId === frame.id ? 'selected' : ''}`}
                      onClick={() => selectFrame(frame.id)}
                    >
                      <i className={variant.previewClass} />
                      <span>{frame.label}</span>
                    </button>
                  )
                })}
              </div>

              {currentFrame.variants.length > 1 && (
                <div className="variant-area">
                  <span className="mini-label">색상 조합</span>
                  <div className="variant-row">
                    {currentFrame.variants.map((variant) => (
                      <button
                        type="button"
                        key={variant.id}
                        className={`variant-chip ${config.frameVariantId === variant.id ? 'selected' : ''}`}
                        onClick={() => setConfig((current) => ({ ...current, frameVariantId: variant.id }))}
                      >
                        <i className={variant.previewClass} />
                        {variant.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {config.layout.type === 'grid' && <section className="control-section">
              <div className="control-title"><strong>그리드 여백</strong></div>
              <div className="segmented">
                <button type="button" aria-pressed={config.mat === 'minimal'} className={config.mat === 'minimal' ? 'selected' : ''} onClick={() => setConfig(c => ({ ...c, mat: 'minimal' }))}>꽉 채우기</button>
                <button type="button" aria-pressed={config.mat !== 'minimal'} className={config.mat !== 'minimal' ? 'selected' : ''} onClick={() => setConfig(c => ({ ...c, mat: 'normal' }))}>여백 있게</button>
              </div>
              <p className="print-note">용지에 맞춰 사진 칸이 채워져요. 액자에 가려질 가장자리는 남겨둬요.</p>
            </section>}

            <section className="control-section inline-controls">
              <div className="control-block">
                <div className="control-title"><strong>사진 간격</strong></div>
                <label className="gap-slider">
                  <span>간격 <output>{(effectiveGapRatio(config) * Math.min(paper(config).widthMm, paper(config).heightMm)).toFixed(1)} mm</output></span>
                  <input aria-label="사진 간격" type="range" min="0" max={Math.floor(maxGapRatio(config) * 1000)} step="1" value={Math.round(effectiveGapRatio(config) * 1000)} onPointerDown={() => history.beginGroup()} onPointerUp={() => history.endGroup()} onPointerCancel={() => history.endGroup()} onBlur={() => history.endGroup()} onChange={event => setConfig(c => ({ ...c, gap: Number(event.target.value) / 1000 }))} />
                  <span className="print-note">붙이기부터 넓게까지 · 용지 크기에 비례해 적용돼요. 작은 하트 칸은 간격 범위가 자동 조정돼요.</span>
                </label>
              </div>

              <label className="gap-slider">
                <span>인쇄 그림자 <output>{Math.round(shadowStrength(config.shadow) * 100)}%</output></span>
                <input aria-label="그림자 강도" type="range" min="0" max="100" step="1" value={Math.round(shadowStrength(config.shadow)*100)} onPointerDown={() => history.beginGroup()} onPointerUp={() => history.endGroup()} onPointerCancel={() => history.endGroup()} onBlur={() => history.endGroup()} onChange={event => setConfig(c => ({ ...c, shadow: Number(event.target.value) }))} />
                <span className="print-note">0%는 그림자 없음 · 인쇄 파일에도 적용돼요.</span>
              </label>
            </section>

            <section className="advanced-section">
              <button type="button" className="advanced-toggle" onClick={() => setAdvancedOpen((open) => !open)}>
                <span>배치 조금 더 바꾸기</span><span>{advancedOpen ? '−' : '+'}</span>
              </button>
              {advancedOpen && (
                <div className="advanced-body">
                  <span className="mini-label">사진 개수</span>
                  <div className="tiny-counts">
                    {(config.layout.type === 'heart' ? HEART_PHOTO_COUNTS : PHOTO_COUNTS).map((count) => (
                      <button
                        type="button"
                        key={count}
                        className={config.layout.photoCount === count ? 'selected' : ''}
                        onClick={() => changePhotoCount(count)}
                      >{count}</button>
                    ))}
                  </div>
                  {config.layout.type === 'grid' && config.layout.rows !== config.layout.columns && (
                    <button type="button" className="soft-button full" onClick={swapOrientation}>↔ 가로 · 세로 바꾸기</button>
                  )}
                  <div className="layout-switch-row">
                    <span className="mini-label">모양</span>
                    <div className="segmented">
                      <button type="button" className={config.layout.type === 'grid' ? 'selected' : ''} onClick={() => setConfig((current) => ({ ...current, layout: getLayoutPreset('grid', current.layout.photoCount) }))}>그리드</button>
                      <button type="button" className={config.layout.type === 'heart' ? 'selected' : ''} onClick={() => { const count = Math.max(4, config.layout.photoCount); history.beginGroup(); setPlacements(resizePlacements(placements, count)); setConfig(c => ({ ...c, layout: getLayoutPreset('heart', count) })); history.endGroup(); closePhoto() }}>하트</button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="control-section"><div className="control-title"><strong>액자 · 인쇄</strong></div><p className="print-note">{config.printSize === 'custom' ? '맞춤 크기' : config.printSize} · {paper(config).widthMm} × {paper(config).heightMm} mm<br />{config.printUse === 'frame' ? `액자 가림 여유 ${config.frameOverlapMm}mm 적용` : '종이 포스터용'}</p><button type="button" className="soft-button full" onClick={() => setSaveOpen(true)}>종이 크기와 여백 설정</button></section>

            <button type="button" className="primary-button save-main" onClick={() => setSaveOpen(true)}>완성했어요 · 저장하기</button>
            <button type="button" className="reset-link" onClick={resetAll}>처음부터 다시 만들기</button>
          </aside>

          <input
            ref={editorInputRef}
            hidden
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              void readFiles(event.target.files, 'append')
              event.currentTarget.value = ''
            }}
          />
        </section>
      )}


      {saveOpen && (
        <div className="sheet-backdrop" onMouseDown={event => event.target === event.currentTarget && setSaveOpen(false)}>
          <section className="bottom-sheet print-sheet" role="dialog" aria-modal="true" aria-label="저장 및 인쇄 설정">
            <div className="sheet-title-row">
              <div><p className="sheet-kicker">완성본 저장</p><h2>크기와 색상을 골라주세요</h2></div>
              <button className="icon-button" type="button" onClick={() => setSaveOpen(false)} aria-label="닫기">×</button>
            </div>
            <div className="print-layout">
              <div className="print-preview"><FramePreview config={config} finish={frameFinish}><PosterPreview config={config} photos={arranged} interactive={false} /></FramePreview>
                <p>{config.printSize === 'custom' ? '맞춤' : config.printSize} · {paper(config).widthMm} × {paper(config).heightMm} mm</p>
              </div>
              <div className="print-controls">
                <strong>용지 크기</strong>
                <p className="print-note">그리드 추천 · A5 1~4장 / A4 4~6장 / A3 6~12장. 실제 사진과 감상 거리에 맞춰 골라주세요.</p>
                <div className="paper-options">
                  {(Object.entries(PRINT_SIZES) as [PrintSize, (typeof PRINT_SIZES)[PrintSize]][]).map(([size, spec]) => (
                    <button type="button" key={size} className={`soft-button ${config.printSize === size ? 'chosen' : ''}`} aria-pressed={config.printSize === size} onClick={() => setConfig(c => ({ ...c, printSize: size }))}>
                      <strong>{size}</strong><small>{spec.hint}</small>
                    </button>
                  ))}
                </div>
                <button type="button" className="soft-button" aria-pressed={config.printSize === 'custom'} onClick={() => setConfig(c => ({ ...c, printSize: 'custom' }))}>액자 종이 크기 직접 입력</button>
                {config.printSize === 'custom' && <div className="custom-paper"><label>짧은 변 (mm)<input type="number" min="80" max="600" defaultValue={config.customWidthMm} onBlur={event => { const value = Number(event.target.value); const safe = Math.max(80, Math.min(600, value || 210)); event.target.value = String(safe); setConfig(c => ({ ...c, customWidthMm: safe })) }} /></label><label>긴 변 (mm)<input type="number" min="80" max="600" defaultValue={config.customHeightMm} onBlur={event => { const value = Number(event.target.value); const safe = Math.max(80, Math.min(600, value || 297)); event.target.value = String(safe); setConfig(c => ({ ...c, customHeightMm: safe })) }} /></label><p className="print-note">80~600mm · 입력 후 다른 곳을 누르면 적용돼요.</p></div>}
                <p className="print-note">액자 겉 크기가 아닌, 안에 넣는 종이 크기를 선택하세요. 별도 매트가 있는 액자는 사진이 보이는 창 크기도 확인해주세요.</p>
                <strong>출력 용도</strong>
                <div className="segmented"><button type="button" className={config.printUse === 'frame' ? 'selected' : ''} onClick={() => setConfig(c => ({ ...c, printUse: 'frame' }))}>액자에 넣기</button><button type="button" className={config.printUse === 'poster' ? 'selected' : ''} onClick={() => setConfig(c => ({ ...c, printUse: 'poster' }))}>종이 포스터</button></div>
                <strong>사진 주변 여백</strong>
                <div className="segmented">{([['minimal', '최소'], ['normal', '기본'], ['wide', '넉넉하게']] as const).map(([value, label]) => <button type="button" key={value} className={config.mat === value ? 'selected' : ''} onClick={() => setConfig(c => ({ ...c, mat: value }))}>{label}</button>)}</div>
                {config.printUse === 'frame' && <details className="export-detail"><summary>액자 테두리에 가려지는 부분 · {config.frameOverlapMm}mm</summary><p>사진이 테두리에 가리지 않도록 안쪽에 여유를 둬요. 실제 액자에 맞춰 선택하세요.</p><div className="segmented">{([3,5,8] as const).map(mm => <button type="button" key={mm} className={config.frameOverlapMm === mm ? 'selected' : ''} onClick={() => setConfig(c => ({ ...c, frameOverlapMm: mm }))}>{mm}mm</button>)}</div></details>}
                <strong>용지 방향</strong>
                <div className="segmented">
                  <button type="button" className={config.orientation === 'portrait' ? 'selected' : ''} onClick={() => setConfig(c => ({ ...c, orientation: 'portrait' }))}>세로 용지</button>
                  <button type="button" className={config.orientation === 'landscape' ? 'selected' : ''} onClick={() => setConfig(c => ({ ...c, orientation: 'landscape' }))}>가로 용지</button>
                </div>
                <strong>색상</strong>
                <div className="color-options segmented">
                  {([['color', '컬러'], ['photos-gray', '사진만 흑백'], ['all-gray', '전체 흑백']] as const).map(([mode, label]) => <button type="button" key={mode} className={config.colorMode === mode ? 'selected' : ''} onClick={() => setConfig(c => ({ ...c, colorMode: mode }))}>{label}</button>)}
                </div>
                <p className="print-note">흑백은 저장 이미지에 적용돼요. 실제 출력 시 프린터 설정도 확인해주세요.</p>
                {placedCount > 0 && (() => {
                  const perSlot = photoDpis(config, arranged)
                  const dpis = perSlot.filter((dpi): dpi is number => dpi !== null)
                  const low = perSlot.map((dpi, i) => dpi !== null && dpi < 150 ? i + 1 : 0).filter(Boolean)
                  const medium = dpis.some(dpi => dpi < 300)
                  return <p className={`quality-note ${low.length ? 'warning' : ''}`} role="status">{low.length ? `사진 ${low.join(', ')}번은 크게 인쇄하면 흐릴 수 있어요. 원본 사진을 쓰거나 확대를 줄여보세요.` : medium ? '일부 사진은 300 DPI보다 낮아요. 작은 글씨나 얼굴을 인쇄 전에 확인해주세요.' : '선택한 크기에서 사진 해상도가 충분해요.'} <span>가장 낮은 사진: 약 {Math.min(...dpis)} DPI</span></p>
                })()}
                {placedCount < config.layout.photoCount && <p className="quality-note warning">{config.layout.photoCount - placedCount}칸이 비어 있어요. 저장하면 해당 위치는 배경으로 남아요.</p>}
                <details className="export-detail"><summary>저장이 어렵다면 · 해상도 변경</summary>
                  <label>출력 해상도 <select aria-label="출력 해상도" value={exportDpi} onChange={event => setExportDpi(Number(event.target.value))}><option value={300}>300 DPI · 고화질</option><option value={150}>150 DPI · 가벼운 파일</option></select></label>
                  <p>150 DPI는 파일을 작게 만들지만 인쇄 선명도가 낮아질 수 있어요.</p>
                </details>
                {pendingExport && <div className="quality-note warning" role="alert"><p>비어 있는 칸을 남기고 저장할까요?</p><div className="export-buttons"><button type="button" className="soft-button" onClick={() => setPendingExport(null)}>돌아가기</button><button type="button" className="soft-button" onClick={() => void handleExport(pendingExport, true)}>빈칸 포함 저장</button></div></div>}
                {exportError && <p className="quality-note warning" role="alert">{exportError}</p>}
                <div className="export-buttons">
                  <button type="button" className="soft-button" disabled={!placedCount || !!busy} onClick={() => void handleExport('png')}>PNG 저장</button>
                  <button type="button" className="primary-button" disabled={!placedCount || !!busy} onClick={() => void handleExport('pdf')}>PDF 저장</button>
                </div>
                <p className="print-note">액자 모형은 파일에 포함되지 않아요. 출력 시 ‘실제 크기(100%)’를 선택하세요. 프린터에 따라 바깥 여백이 생길 수 있어요.</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {busy && (
        <div className="busy-overlay" role="status" aria-live="polite">
          <span className="spinner" /><strong>{busy}</strong><p>잠시만 기다려주세요.</p>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  )
}
