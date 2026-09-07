import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorHistory } from './hooks/useEditorHistory'
import { paper, slotsFor, photoDpis } from './utils/geometry'
import PosterPreview from './components/PosterPreview'
import PhotoAdjuster from './components/PhotoAdjuster'
import { framePresets, getFramePreset } from './presets/frames'
import { getHeartSlots, getLayoutPreset, PHOTO_COUNTS } from './presets/layouts'
import type { EditorConfig, LayoutType, PhotoItem } from './types/editor'
import { exportPdf, exportPng, PRINT_SIZES, type PrintSize } from './utils/render'

type Step = 'home' | 'layout' | 'count' | 'upload' | 'editor'

const initialConfig: EditorConfig = {
  layout: getLayoutPreset('grid', 9),
  gap: 'normal',
  frameId: 'white',
  frameVariantId: 'white',
  shadow: 'on',
  printSize: 'A4',
  orientation: 'portrait',
  colorMode: 'color',
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
  const { config, photos, setConfig, setPhotos } = history
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [exportDpi, setExportDpi] = useState(300)
  const [exportError, setExportError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const editorInputRef = useRef<HTMLInputElement>(null)




  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!selectedPhotoId && !saveOpen) return
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
        if (selectedPhotoId) { history.endGroup(); setSelectedPhotoId(null) }
        else setSaveOpen(false)
      }
      if (event.key === 'Tab') {
        const items = focusable(), first = items[0], last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus() }
  }, [!!selectedPhotoId, saveOpen])

  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId) ?? null,
    [photos, selectedPhotoId],
  )
  const selectedIndex = selectedPhoto ? photos.findIndex((photo) => photo.id === selectedPhoto.id) : -1
  const currentFrame = getFramePreset(config.frameId)

  function chooseLayout(type: LayoutType) {
    const count = type === 'heart' ? 12 : 9
    setConfig((current) => ({ ...current, layout: getLayoutPreset(type, count) }))
    setStep('count')
  }

  function chooseCount(count: number) {
    setConfig((current) => ({ ...current, layout: getLayoutPreset(current.layout.type, count) }))
    setStep('upload')
  }

  async function readFiles(fileList: FileList | null, mode: 'replace-all' | 'append') {
    if (!fileList?.length) return
    const capacity = config.layout.photoCount
    const available = mode === 'append' ? Math.max(0, capacity - photos.length) : capacity
    const files = Array.from(fileList).slice(0, available)
    if (!files.length) {
      setToast('이미 모든 칸이 채워졌어요.')
      return
    }

    setBusy('사진을 준비하고 있어요')
    try {
      const results = await Promise.allSettled(files.map((file) => fileToPhoto(file)))
      const next = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : [])
      if (!next.length) { setToast('사진을 불러오지 못했어요. JPG, PNG, WEBP 사진을 선택해주세요.'); return }
      next.forEach(photo => history.register(photo.url))
      const failed = results.length - next.length
      if (failed) setToast(`${next.length}장은 넣었어요. 읽지 못한 ${failed}장은 다른 형식으로 다시 선택해주세요.`)
      else if (fileList.length > available) setToast(`${available}장을 넣었어요. 선택한 나머지 사진은 제외했어요.`)
      if (mode === 'replace-all') {
        setPhotos(next)
        setStep('editor')
      } else {
        setPhotos((current) => [...current, ...next].slice(0, capacity))
      }
    } catch {
      setToast('일부 사진을 불러오지 못했어요. JPG, PNG, WEBP 사진을 사용해주세요.')
    } finally {
      setBusy(null)
    }
  }

  function changePhotoCount(count: number) {
    if (count === config.layout.photoCount) return
    if (count < photos.length) {
      const ok = window.confirm(`${count}장으로 바꾸면 뒤쪽 ${photos.length - count}장의 사진이 빠져요. 계속할까요?`)
      if (!ok) return
      history.beginGroup()
      setPhotos((current) => current.slice(0, count))
    }
    setConfig((current) => ({ ...current, layout: getLayoutPreset(current.layout.type, count) }))
    history.endGroup()
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

  function movePhoto(from: number, to: number) {
    setPhotos((current) => {
      if (!current[from]) return current
      const next = [...current]
      const [item] = next.splice(from, 1)
      next.splice(Math.min(to, next.length), 0, item)
      return next
    })
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
    setPhotos((current) => current.filter((photo) => photo.id !== selectedPhoto.id))
    closePhoto()
  }

  function moveSelected(direction: -1 | 1) {
    if (selectedIndex < 0) return
    const target = selectedIndex + direction
    if (target < 0 || target >= photos.length) return
    movePhoto(selectedIndex, target)
  }

  function selectFrame(frameId: string) {
    const frame = getFramePreset(frameId)
    setConfig((current) => ({ ...current, frameId, frameVariantId: frame.variants[0].id }))
  }

  function openPhoto(id: string) { history.beginGroup(); setSelectedPhotoId(id) }
  function closePhoto() { history.endGroup(); setSelectedPhotoId(null) }

  async function handleExport(format: 'png' | 'pdf') {
    if (!photos.length) { setExportError('사진을 한 장 이상 넣어주세요.'); return }
    const empty = config.layout.photoCount - photos.length
    if (empty > 0 && !window.confirm(`아직 ${empty}칸이 비어 있어요. 빈칸을 남기고 저장할까요?`)) return
    setExportError(null)
    setBusy(`${config.printSize} ${format.toUpperCase()}를 만들고 있어요`)
    try {
      // Let the busy state paint before allocating a large print canvas.
      await new Promise(resolve => setTimeout(resolve, 50))
      if (format === 'png') await exportPng(config, photos, exportDpi)
      else await exportPdf(config, photos, exportDpi)
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
          <button type="button" className="top-save" onClick={() => setSaveOpen(true)}>저장하기</button>
        )}
      </header>

      {step === 'home' && (
        <section className="home-screen">
          <div className="hero-copy">
            <span className="eyebrow">FREE PHOTO FRAME MAKER</span>
            <h1>사진만 고르면,<br />예쁜 한 장이 완성돼요.</h1>
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
            <article><strong>02</strong><h3>사진 넣기</h3><p>여러 장을 한 번에 고르면 자동으로 채워져요.</p></article>
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
            {['layout', 'count', 'upload'].map((item, index) => (
              <span key={item} className={item === step ? 'active' : ['layout', 'count', 'upload'].indexOf(step) > index ? 'done' : ''} />
            ))}
          </div>

          {step === 'layout' && (
            <div className="flow-content">
              <p className="step-label">1 / 3</p>
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
              <p className="step-label">2 / 3</p>
              <h2>사진을 몇 장 넣을까요?</h2>
              <p className="step-desc">자주 쓰는 개수만 준비했어요.</p>
              {config.layout.type === 'heart' && <p className="print-note">12장 이상을 추천해요. 4·6장은 단순한 하트 배치예요.</p>}
              <div className="count-grid">
                {PHOTO_COUNTS.map((count) => {
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

          {step === 'upload' && (
            <div className="flow-content compact-flow">
              <p className="step-label">3 / 3</p>
              <h2>사진을 골라주세요</h2>
              <p className="step-desc">최대 {config.layout.photoCount}장까지 한 번에 선택할 수 있어요.</p>
              <button type="button" className="upload-card" onClick={() => uploadInputRef.current?.click()}>
                <span className="upload-icon">＋</span>
                <strong>사진 선택하기</strong>
                <span>JPG · PNG · WEBP</span>
              </button>
              <input
                ref={uploadInputRef}
                hidden
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  void readFiles(event.target.files, 'replace-all')
                  event.currentTarget.value = ''
                }}
              />
              <div className="privacy-card">
                <span>🔒</span>
                <div><strong>사진은 기기 안에서만 처리돼요.</strong><p>서버 업로드나 회원가입 없이 바로 만들 수 있어요.</p></div>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 'editor' && (
        <section className="editor-screen">
          <div className="preview-column">
            <div className="editor-heading">
              <div><p className="step-label">미리보기</p><h2>이미 거의 다 됐어요.</h2></div>
              <span className="local-badge">🔒 기기에서만 편집 중</span>
            </div>
            <div className="preview-stage">
              <PosterPreview
                config={config}
                photos={photos}
                selectedPhotoId={selectedPhotoId}
                onSelectPhoto={openPhoto}
                onMovePhoto={movePhoto}
                onAddPhoto={() => editorInputRef.current?.click()}
              />
            </div>
            <div className="history-controls">
              <button type="button" className="soft-button" disabled={!history.canUndo} onClick={history.undo}>↶ 실행 취소</button>
              <button type="button" className="soft-button" disabled={!history.canRedo} onClick={history.redo}>↷ 다시 실행</button>
            </div>
            <p className="preview-help">사진을 눌러 위치와 확대를 조절할 수 있어요.</p>
          </div>

          <aside className="control-panel">
            <section className="control-section">
              <div className="control-title"><strong>프레임</strong><span>분위기만 골라주세요</span></div>
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

            <section className="control-section inline-controls">
              <div className="control-block">
                <div className="control-title"><strong>사진 간격</strong></div>
                <div className="segmented">
                  {(['narrow', 'normal', 'wide'] as const).map((gap) => (
                    <button
                      type="button"
                      key={gap}
                      className={config.gap === gap ? 'selected' : ''}
                      onClick={() => setConfig((current) => ({ ...current, gap }))}
                    >
                      {gap === 'narrow' ? '좁게' : gap === 'normal' ? '기본' : '넓게'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="shadow-control">
                <div><strong>그림자</strong><span>사진을 살짝 띄워줘요</span></div>
                <button
                  type="button"
                  className={`switch ${config.shadow === 'on' ? 'on' : ''}`}
                  onClick={() => setConfig((current) => ({ ...current, shadow: current.shadow === 'on' ? 'off' : 'on' }))}
                  aria-label="그림자 켜기 또는 끄기"
                ><i /></button>
              </div>
            </section>

            <section className="advanced-section">
              <button type="button" className="advanced-toggle" onClick={() => setAdvancedOpen((open) => !open)}>
                <span>배치 조금 더 바꾸기</span><span>{advancedOpen ? '−' : '+'}</span>
              </button>
              {advancedOpen && (
                <div className="advanced-body">
                  <span className="mini-label">사진 개수</span>
                  <div className="tiny-counts">
                    {PHOTO_COUNTS.map((count) => (
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
                      <button type="button" className={config.layout.type === 'heart' ? 'selected' : ''} onClick={() => setConfig((current) => ({ ...current, layout: getLayoutPreset('heart', current.layout.photoCount) }))}>하트</button>
                    </div>
                  </div>
                </div>
              )}
            </section>

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

      {selectedPhoto && selectedIndex >= 0 && (
        <PhotoAdjuster
          config={config}
          aspectRatio={(() => { const page = paper(config); const slot = slotsFor(config, page.width, page.height)[selectedIndex]; return slot.width / slot.height })()}
          photo={selectedPhoto}
          index={selectedIndex}
          total={photos.length}
          onChange={patchSelectedPhoto}
          onReplace={(file) => void replaceSelectedPhoto(file)}
          onDelete={deleteSelectedPhoto}
          onMove={moveSelected}
          onClose={closePhoto}
        />
      )}

      {saveOpen && (
        <div className="sheet-backdrop" onMouseDown={event => event.target === event.currentTarget && setSaveOpen(false)}>
          <section className="bottom-sheet print-sheet" role="dialog" aria-modal="true" aria-label="저장 및 인쇄 설정">
            <div className="sheet-title-row">
              <div><p className="sheet-kicker">완성본 저장</p><h2>크기와 색상을 골라주세요</h2></div>
              <button className="icon-button" type="button" onClick={() => setSaveOpen(false)} aria-label="닫기">×</button>
            </div>
            <div className="print-layout">
              <div className="print-preview"><PosterPreview config={config} photos={photos} interactive={false} />
                <p>{config.printSize} · {paper(config).widthMm} × {paper(config).heightMm} mm</p>
              </div>
              <div className="print-controls">
                <strong>용지 크기</strong>
                <div className="paper-options">
                  {(Object.entries(PRINT_SIZES) as [PrintSize, (typeof PRINT_SIZES)[PrintSize]][]).map(([size, spec]) => (
                    <button type="button" key={size} className={`soft-button ${config.printSize === size ? 'chosen' : ''}`} aria-pressed={config.printSize === size} onClick={() => setConfig(c => ({ ...c, printSize: size }))}>
                      <strong>{size}</strong><small>{spec.hint}</small>
                    </button>
                  ))}
                </div>
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
                {photos.length > 0 && (() => {
                  const dpis = photoDpis(config, photos)
                  const low = dpis.map((dpi, i) => dpi < 150 ? i + 1 : 0).filter(Boolean)
                  const medium = dpis.some(dpi => dpi < 300)
                  return <p className={`quality-note ${low.length ? 'warning' : ''}`} role="status">{low.length ? `사진 ${low.join(', ')}번은 크게 인쇄하면 흐릴 수 있어요. 원본 사진을 쓰거나 확대를 줄여보세요.` : medium ? '일부 사진은 300 DPI보다 낮아요. 작은 글씨나 얼굴을 인쇄 전에 확인해주세요.' : '선택한 크기에서 사진 해상도가 충분해요.'} <span>가장 낮은 사진: 약 {Math.min(...dpis)} DPI</span></p>
                })()}
                {photos.length < config.layout.photoCount && <p className="quality-note warning">{config.layout.photoCount - photos.length}칸이 비어 있어요. 저장하면 해당 위치는 배경으로 남아요.</p>}
                <details className="export-detail"><summary>저장이 어렵다면 · 해상도 변경</summary>
                  <label>출력 해상도 <select aria-label="출력 해상도" value={exportDpi} onChange={event => setExportDpi(Number(event.target.value))}><option value={300}>300 DPI · 고화질</option><option value={150}>150 DPI · 가벼운 파일</option></select></label>
                  <p>150 DPI는 파일을 작게 만들지만 인쇄 선명도가 낮아질 수 있어요.</p>
                </details>
                {exportError && <p className="quality-note warning" role="alert">{exportError}</p>}
                <div className="export-buttons">
                  <button type="button" className="soft-button" disabled={!photos.length || !!busy} onClick={() => void handleExport('png')}>PNG 저장</button>
                  <button type="button" className="primary-button" disabled={!photos.length || !!busy} onClick={() => void handleExport('pdf')}>PDF 저장</button>
                </div>
                <p className="print-note">워터마크 없이 무료 · 출력 시 ‘실제 크기(100%)’를 선택하세요. 프린터에 따라 바깥 여백이 생길 수 있어요.</p>
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
