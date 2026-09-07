import { useState } from 'react'
import type { PhotoItem } from '../types/editor'
interface Props {
  photos: PhotoItem[]; placements: (string | null)[]; selectedId: string | null
  onAdd: () => void; onSelect: (id: string) => void; onEdit: (id: string) => void
  onRemove: (id: string) => void; onFill: () => void; onCancel: () => void
}
export default function PhotoLibrary({ photos, placements, selectedId, onAdd, onSelect, onEdit, onRemove, onFill, onCancel }: Props) {
  const [unplacedOnly, setUnplacedOnly] = useState(false)
  const unused = photos.filter(photo => !placements.includes(photo.id))
  const shown = unplacedOnly ? unused : photos
  return <section className="photo-library" aria-label="사진관리" id="photo-library">
    <div className="library-heading"><div><h3>사진관리 <span>{photos.length}장</span></h3><p>여러 장을 더 넣고, 원하는 사진으로 바꿔보세요.</p></div>
      <button type="button" className="primary-button compact" onClick={onAdd}>＋ 사진 여러 장 추가</button>
    </div>
    <div className="library-toolbar">
      <div className="segmented"><button type="button" aria-pressed={!unplacedOnly} className={!unplacedOnly ? 'selected' : ''} onClick={() => setUnplacedOnly(false)}>전체 {photos.length}</button><button type="button" aria-pressed={unplacedOnly} className={unplacedOnly ? 'selected' : ''} onClick={() => setUnplacedOnly(true)}>미배치 {unused.length}</button></div>
      <button type="button" className="soft-button" disabled={!unused.length || !placements.includes(null)} onClick={onFill}>빈칸 자동 채우기</button>
    </div>
    <p className="library-help">사진을 끌어 원하는 칸에 놓으세요. 휴대폰에서는 사진을 고른 뒤 칸을 눌러주세요.</p>
    {selectedId && <div className="placement-message" role="status">이 사진을 넣을 칸을 눌러주세요.<button type="button" onClick={onCancel}>선택 취소</button></div>}
    <div className="library-strip" tabIndex={0} aria-label="추가된 사진 목록">
      {!shown.length && <p className="library-empty">{photos.length ? '모든 사진이 배치됐어요. 다른 사진도 더 추가할 수 있어요.' : '사진을 여러 장 선택해 추가해주세요.'}</p>}
      {shown.map(photo => {
        const slot = placements.indexOf(photo.id), label = photo.file.name
        return <article key={photo.id} className={`library-photo ${selectedId === photo.id ? 'active' : ''}`}>
          <button type="button" className="library-thumb" aria-label={`${label} 배치하기`} aria-pressed={selectedId === photo.id} onClick={() => onSelect(photo.id)} draggable
            onDragStart={event => { event.dataTransfer.setData('application/x-memory-frame-photo', photo.id); event.dataTransfer.effectAllowed = 'move' }}>
            <img src={photo.url} alt={label} draggable={false} loading="lazy" />
            <span>{slot >= 0 ? `${slot + 1}번 칸` : '미배치'}</span>
          </button>
          <p title={label}>{label}</p>
          <div className="library-photo-actions"><button type="button" aria-label={`${label} 편집`} onClick={() => onEdit(photo.id)}>편집</button><button type="button" aria-label={`${label} 보관함에서 삭제`} onClick={() => onRemove(photo.id)}>삭제</button></div>
        </article>
      })}
    </div>
  </section>
}
