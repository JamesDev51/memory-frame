import { useEffect, useMemo, useRef, useState } from 'react'
import PosterPreview from './components/PosterPreview'
import PhotoAdjuster from './components/PhotoAdjuster'
import { framePresets, getFramePreset } from './presets/frames'
import { getLayoutPreset, PHOTO_COUNTS } from './presets/layouts'
import type { EditorConfig, LayoutType, PhotoItem } from './types/editor'
import { exportPdf, exportPng, PRINT_SIZES, type PrintSize } from './utils/render'

type Step = 'home' | 'layout' | 'count' | 'upload' | 'editor'

const initialConfig: EditorConfig = {
  layout: getLayoutPreset('grid', 9),
  gap: 'normal',
  frameId: 'white',
  frameVariantId: 'white',
  shadow: 'on',
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
        {Array.from({ length: 12 }).map((_, index) => <i key={index} />)}
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
  const [config, setConfig] = useState<EditorConfig>(initialConfig)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const uploadInputRef = useRef<HTMLInputElement>(null)
  const editorInputRef = useRef<HTMLInputElement>(null)
  const photosRef = useRef<PhotoItem[]>([])

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  useEffect(() => () => {
    photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url))
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timer)
  }, [toast])

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
      const next = await Promise.all(files.map((file) => fileToPhoto(file)))
      if (mode === 'replace-all') {
        photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url))
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
    if (count < photos.length) {
      const ok = window.confirm(`${count}장으로 바꾸면 뒤쪽 ${photos.length - count}장의 사진이 빠져요. 계속할까요?`)
      if (!ok) return
      const removed = photos.slice(count)
      removed.forEach((photo) => URL.revokeObjectURL(photo.url))
      setPhotos((current) => current.slice(0, count))
    }
    setConfig((current) => ({ ...current, layout: getLayoutPreset(current.layout.type, count) }))
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
      URL.revokeObjectURL(selectedPhoto.url)
      setPhotos((current) => current.map((photo) => photo.id === selectedPhoto.id ? { ...replacement, id: selectedPhoto.id } : photo))
    } catch {
      setToast('이 사진은 불러올 수 없어요.')
    } finally {
      setBusy(null)
    }
  }

  function deleteSelectedPhoto() {
    if (!selectedPhoto) return
    URL.revokeObjectURL(selectedPhoto.url)
    setPhotos((current) => current.filter((photo) => photo.id !== selectedPhoto.id))
    setSelectedPhotoId(null)
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

  async function handlePngExport() {
    if (!photos.length) return
    setBusy('고화질 이미지를 만들고 있어요')
    try {
      await exportPng(config, photos.slice(0, config.layout.photoCount))
      setSaveOpen(false)
      setToast('PNG 저장을 시작했어요.')
    } catch {
      setToast('이미지 저장 중 문제가 생겼어요. 다시 시도해주세요.')
    } finally {
      setBusy(null)
    }
  }

  async function handlePdfExport(size: PrintSize) {
    if (!photos.length) return
    setBusy(`${size} 인쇄용 PDF를 만들고 있어요`)
    try {
      await exportPdf(config, photos.slice(0, config.layout.photoCount), size)
      setPdfOpen(false)
      setSaveOpen(false)
      setToast('PDF 저장을 시작했어요.')
    } catch {
      setToast('PDF 저장 중 문제가 생겼어요. 다른 크기로 다시 시도해주세요.')
    } finally {
      setBusy(null)
    }
  }

  function resetAll() {
    const ok = !photos.length || window.confirm('현재 사진과 설정을 모두 지우고 처음으로 돌아갈까요?')
    if (!ok) return
    photos.forEach((photo) => URL.revokeObjectURL(photo.url))
    setPhotos([])
    setSelectedPhotoId(null)
    setConfig(initialConfig)
    setAdvancedOpen(false)
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
            <article><strong>03</strong><h3>바로 저장</h3><p>고화질 PNG와 A5·A4·A3 PDF로 저장해요.</p></article>
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
              <div className="count-grid">
                {PHOTO_COUNTS.map((count) => {
                  const preset = getLayoutPreset(config.layout.type, count)
                  return (
                    <button key={count} type="button" className="count-button" onClick={() => chooseCount(count)}>
                      <strong>{count}<small>장</small></strong>
                      <span>{config.layout.type === 'heart' ? '하트 자동 배치' : `${preset.columns} × ${preset.rows}`}</span>
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
                onSelectPhoto={setSelectedPhotoId}
                onMovePhoto={movePhoto}
                onAddPhoto={() => editorInputRef.current?.click()}
              />
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
          photo={selectedPhoto}
          index={selectedIndex}
          total={photos.length}
          onChange={patchSelectedPhoto}
          onReplace={(file) => void replaceSelectedPhoto(file)}
          onDelete={deleteSelectedPhoto}
          onMove={moveSelected}
          onClose={() => setSelectedPhotoId(null)}
        />
      )}

      {saveOpen && (
        <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSaveOpen(false)}>
          <section className="bottom-sheet save-sheet" role="dialog" aria-modal="true" aria-label="저장 형식 선택">
            <div className="sheet-grabber" />
            <div className="sheet-title-row">
              <div><p className="sheet-kicker">완성!</p><h2>어떻게 저장할까요?</h2></div>
              <button className="icon-button" type="button" onClick={() => setSaveOpen(false)}>×</button>
            </div>
            <button type="button" className="export-option" onClick={() => void handlePngExport()}>
              <span className="export-icon">IMG</span><div><strong>고화질 PNG</strong><span>휴대폰 저장 · SNS 공유용</span></div><b>→</b>
            </button>
            <button type="button" className="export-option" onClick={() => setPdfOpen(true)}>
              <span className="export-icon">PDF</span><div><strong>인쇄용 PDF</strong><span>액자 · 인쇄소 출력용</span></div><b>→</b>
            </button>
            <p className="export-note">워터마크 없이 무료로 저장돼요.</p>
          </section>
        </div>
      )}

      {pdfOpen && (
        <div className="sheet-backdrop layer-two" onMouseDown={(event) => event.target === event.currentTarget && setPdfOpen(false)}>
          <section className="bottom-sheet pdf-sheet" role="dialog" aria-modal="true" aria-label="PDF 크기 선택">
            <div className="sheet-grabber" />
            <div className="sheet-title-row">
              <div><p className="sheet-kicker">인쇄용 PDF</p><h2>어떤 크기로 출력할까요?</h2></div>
              <button className="icon-button" type="button" onClick={() => setPdfOpen(false)}>×</button>
            </div>
            <div className="size-options">
              {(Object.entries(PRINT_SIZES) as [PrintSize, (typeof PRINT_SIZES)[PrintSize]][]).map(([size, spec]) => (
                <button type="button" key={size} className={`size-option ${size === 'A4' ? 'recommended' : ''}`} onClick={() => void handlePdfExport(size)}>
                  {size === 'A4' && <span className="recommend-badge">추천</span>}
                  <strong>{size}</strong><span>{spec.hint}</span><small>{spec.widthMm} × {spec.heightMm} mm</small>
                </button>
              ))}
            </div>
            <p className="export-note">원본 사진을 이용해 300 DPI 기준으로 고해상도 렌더링합니다.</p>
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
