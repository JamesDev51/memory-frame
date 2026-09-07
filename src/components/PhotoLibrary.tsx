import { useState } from 'react'
import type { PhotoItem } from '../types/editor'
interface Props {
  photos: PhotoItem[]; placements: (string | null)[]; selectedId: string | null
  onFill: () => void
  onAdd: () => void; onSelect: (id: string) => void; onEdit: (id: string) => void
  onRemove: (id: string) => void; onCancel: () => void
}
export default function PhotoLibrary({ photos, placements, selectedId, onAdd, onFill, onSelect, onEdit, onRemove, onCancel }: Props) {
  const [filter, setFilter] = useState<'all' | 'used' | 'unused'>('all')
  const unused = photos.filter(photo => !placements.includes(photo.id))
  const shown = filter === 'unused' ? unused : filter === 'used' ? photos.filter(photo => placements.includes(photo.id)) : photos
  return <section className="photo-library" aria-label="사진관리" id="photo-library">
    <div className="library-heading"><div><h3>사진관리 <span>{photos.length}장</span></h3><p>여러 장을 더 넣고, 원하는 사진으로 바꿔보세요.</p></div>
      <button type="button" className="primary-button compact" onClick={onAdd}>＋ 사진 여러 장 추가</button>
    </div>
    <button type="button" className="soft-button" disabled={!unused.length || !placements.includes(null)} onClick={onFill}>미사용 사진으로 빈칸 채우기</button>
    <div className="library-toolbar">
      <div className="segmented library-filters">{([['all', `전체 ${photos.length}`], ['used', `사용 중 ${photos.length - unused.length}`], ['unused', `미사용 ${unused.length}`]] as const).map(([value,label]) => <button type="button" key={value} aria-pressed={filter === value} className={filter === value ? 'selected' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div>
    </div>
    <p className="library-help">사진을 끌어 원하는 칸에 놓으세요. 휴대폰에서는 사진을 고른 뒤 칸을 눌러주세요.</p>
    {selectedId && <div className="placement-message" role="status">이 사진을 넣을 칸을 눌러주세요.<button type="button" onClick={onCancel}>선택 취소</button></div>}
    <div className="library-strip" tabIndex={0} aria-label="추가된 사진 목록">
      {!shown.length && <p className="library-empty">{photos.length ? '이 분류에 해당하는 사진이 없어요.' : '사진을 여러 장 선택해 추가해주세요.'}</p>}
      {shown.map(photo => {
        const usedSlots=placements.flatMap((id,i)=>id===photo.id?[i+1]:[]); const slot = placements.indexOf(photo.id), label = `사진 ${photos.indexOf(photo) + 1}`
        return <article key={photo.id} className={`library-photo ${selectedId === photo.id ? 'active' : ''} ${slot >= 0 ? 'is-used' : 'is-unused'}`}>
          <button type="button" className="library-thumb" aria-label={`${label} 배치하기`} aria-pressed={selectedId === photo.id} onClick={() => onSelect(photo.id)} draggable
            onDragStart={event => { event.dataTransfer.setData('application/x-memory-frame-photo', photo.id); event.dataTransfer.effectAllowed = 'move' }}>
            <img src={photo.url} alt={label} draggable={false} loading="lazy" />
            <span>{slot >= 0 ? `사용 ${usedSlots.length}회 · ${usedSlots.join(', ')}번` : '미사용'}</span>
          </button>

          <div className="library-photo-actions"><button type="button" aria-label={`${label} 편집`} onClick={() => onEdit(photo.id)}>편집</button><button type="button" aria-label={`${label} 보관함에서 삭제`} onClick={() => onRemove(photo.id)}>삭제</button></div>
        </article>
      })}
    </div>
  </section>
}
