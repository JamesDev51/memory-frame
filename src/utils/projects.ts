import type { Snapshot } from './history'
import type { Placement } from './placements'
export type Project = { id: string; name: string; updatedAt: number; thumbnail: string; version: 1; snapshot: Snapshot }
const DB = 'memory-frame-projects'
let connection: Promise<IDBDatabase> | undefined
function database() {
  return connection ??= new Promise((resolve,reject) => {
    const request = indexedDB.open(DB,1)
    request.onupgradeneeded = () => request.result.createObjectStore('projects',{keyPath:'id'})
    request.onsuccess = () => { request.result.onversionchange = () => { request.result.close(); connection=undefined }; resolve(request.result) }
    request.onerror = () => { connection=undefined; reject(request.error) }
  })
}
async function transaction<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await database()
  return new Promise<T>((resolve,reject) => {
    const tx = db.transaction('projects',mode), request = run(tx.objectStore('projects'))
    tx.oncomplete = () => resolve(request.result)
    tx.onabort = () => reject(tx.error ?? new Error('저장 취소'))
    tx.onerror = () => reject(tx.error)
  })
}
export async function saveProject(project: Project) {
  // Persist actual File blobs, never temporary blob URLs.
  const snapshot = { ...project.snapshot, photos: project.snapshot.photos.map(p => ({...p,url:''})) }
  await transaction('readwrite',s => s.put({...project,snapshot}))
}
export async function listProjects() { return (await transaction<Project[]>('readonly',s => s.getAll())).sort((a,b) => b.updatedAt-a.updatedAt) }
export async function deleteProject(id: string) { await transaction('readwrite',s => s.delete(id)) }
export function hydrate(project: Project): Snapshot {
  const created: string[] = []
  try { return { ...project.snapshot, photos: project.snapshot.photos.map(p => { const url=URL.createObjectURL(p.file); created.push(url); return {...p,url} }) } }
  catch(error) { created.forEach(url=>URL.revokeObjectURL(url)); throw error }
}
function dataUrl(blob: Blob) { return new Promise<string>((resolve,reject) => { const r=new FileReader(); r.onload=()=>resolve(String(r.result)); r.onerror=()=>reject(r.error); r.readAsDataURL(blob) }) }
export async function projectFile(project: Project) {
  const photos = await Promise.all(project.snapshot.photos.map(async p => ({...p,url:'',file:undefined,name:p.file.name,mime:p.file.type,data:await dataUrl(p.file)})))
  return new Blob([JSON.stringify({...project,snapshot:{...project.snapshot,photos}})],{type:'application/json'})
}
export async function readProjectFile(file: File): Promise<Project> {
  if (file.size > 300*1024*1024) throw new Error('작업 파일은 300MB 이하로 선택해주세요.')
  const p = JSON.parse(await file.text())
  if (p.version !== 1 || !p.snapshot || !Array.isArray(p.snapshot.photos) || p.snapshot.photos.length>500) throw new Error('지원하지 않는 작업 파일이에요.')
  const c=p.snapshot.config
  const finite=(n: unknown, min: number,max: number) => typeof n==='number' && Number.isFinite(n) && n>=min && n<=max
  const layout=(l: any) => l && ['grid','heart'].includes(l.type) && [1,2,4,6,9,12,16,20].includes(l.photoCount) && (l.type!=='heart'||l.photoCount>=4) && Number.isInteger(l.rows) && Number.isInteger(l.columns) && l.rows>=1 && l.columns>=1 && l.rows*l.columns<=36
  if (!c || !layout(c.layout) || !['A5','A4','A3','A2','5x7','8x10','custom'].includes(c.printSize) || !['portrait','landscape'].includes(c.orientation) || !['color','photos-gray','all-gray'].includes(c.colorMode) || !['minimal','normal','wide'].includes(c.mat) || !['frame','poster'].includes(c.printUse) || ![3,5,8].includes(c.frameOverlapMm) || !finite(c.customWidthMm,80,600)||!finite(c.customHeightMm,80,600) || !(finite(c.gap,0,.08)||['narrow','normal','wide'].includes(c.gap)) || !(finite(c.shadow,0,100)||['on','off'].includes(c.shadow)) || (c.cardBorder!==undefined&&!finite(c.cardBorder,.02,.1)) || (c.cardBottom!==undefined&&!finite(c.cardBottom,.1,.3)) || (c.cardColor!==undefined&&!['#ffffff','#f7f7f7'].includes(c.cardColor))) throw new Error('작업 설정이 올바르지 않아요.')
  const ids=new Set<string>()
  for (const photo of p.snapshot.photos) {
    if (typeof photo.id!=='string'||ids.has(photo.id)||!finite(photo.naturalWidth,1,100000)||!finite(photo.naturalHeight,1,100000)||typeof photo.data!=='string'||!/^data:image\/(png|jpeg|webp|gif|avif|bmp);base64,/.test(photo.data)) throw new Error('사진 데이터가 올바르지 않아요.')
    ids.add(photo.id)
    const bytes=Uint8Array.from(atob(photo.data.split(',')[1]),char=>char.charCodeAt(0))
    photo.file=new File([bytes], typeof photo.name==='string'?photo.name:'photo', {type:photo.data.slice(5,photo.data.indexOf(';'))}); photo.url=''; delete photo.data
  }
  const validate=(slots: (Placement|null)[]) => {
    if (!Array.isArray(slots)||slots.length>36) throw new Error('칸 정보가 올바르지 않아요.')
    const instances=new Set<string>()
    for(const slot of slots) if(slot) {
      if(typeof slot.id!=='string'||instances.has(slot.id)||!ids.has(slot.photoId)||!finite(slot.scale,1,3)||!finite(slot.offsetX,-1,1)||!finite(slot.offsetY,-1,1)||![0,90,180,270].includes(slot.rotation)||!['cover','contain'].includes(slot.fit)) throw new Error('사진 편집 정보가 올바르지 않아요.')
      instances.add(slot.id)
    }
  }
  validate(p.snapshot.placements)
  for (const [key,value] of Object.entries(p.snapshot.layouts ?? {}) as [string,any][]) { if (!['grid','heart'].includes(key)||!layout(value?.layout)||value.layout.type!==key) throw new Error('배치 정보가 올바르지 않아요.'); validate(value.placements) }
  return {...p,id:crypto.randomUUID(),name:typeof p.name==='string'?p.name.slice(0,80):'불러온 작업',thumbnail:'',updatedAt:Date.now()}
}
