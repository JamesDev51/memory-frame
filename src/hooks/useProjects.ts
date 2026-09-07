import { useCallback, useEffect, useRef, useState } from 'react'
import type { Snapshot } from '../utils/history'
import { saveProject, listProjects, hydrate, deleteProject, projectFile, readProjectFile, type Project } from '../utils/projects'
export function useProjects(snapshot: Snapshot, restore: (s: Snapshot) => void) {
  const [ready,setReady]=useState(false), [status,setStatus]=useState('작업 확인 중'), [items,setItems]=useState<Project[]>([])
  const [current,setCurrent]=useState<{id:string;name:string}>({id:crypto.randomUUID(),name:'새 작업'})
  const [pending,setPending]=useState(false)
  const locked=useRef(false)
  const [open,setOpen]=useState(false)
  const latest=useRef(snapshot); latest.current=snapshot
  const identity=useRef(current); identity.current=current
  const restoreRef=useRef(restore); restoreRef.current=restore
  const savedIds=useRef(new Set<string>())
  const queue=useRef<Promise<unknown>>(Promise.resolve()), mounted=useRef(true), revision=useRef(0)
  useEffect(()=> { mounted.current=true; let active=true
    listProjects().then(rows=> { if(!active)return; setItems(rows);rows.forEach(p=>savedIds.current.add(p.id)); if(rows.length) setOpen(true); setStatus('이 브라우저에 저장'); setReady(true) }).catch(()=> { if(active){setStatus('저장 공간을 열 수 없어요 · 작업 파일로 백업해주세요');setReady(true)} })
    return()=>{active=false;mounted.current=false}
  },[])
  const flush=useCallback(async()=> {
    const snap=latest.current, who=identity.current, rev=++revision.current
    if(!snap.photos.length && !savedIds.current.has(who.id)) return
    setStatus('저장 중…')
    const canvas=document.querySelector<HTMLCanvasElement>('.canvas-poster canvas')
    let thumbnail=''
    if(canvas?.width) { const small=document.createElement('canvas');small.width=120;small.height=Math.round(120*canvas.height/canvas.width);small.getContext('2d')?.drawImage(canvas,0,0,small.width,small.height);thumbnail=small.toDataURL('image/jpeg',.7) }
    const project: Project={...who,updatedAt:Date.now(),thumbnail,version:1,snapshot:snap}
    const task=queue.current.catch(()=>{}).then(()=>saveProject(project)); queue.current=task
    try { await task; savedIds.current.add(who.id); if(mounted.current&&rev===revision.current) setStatus('저장됨') }
    catch(error) { if(mounted.current) setStatus('저장 실패 · 작업 파일로 백업해주세요'); throw error }
  },[])
  useEffect(()=> { if(!ready||(!snapshot.photos.length&&!savedIds.current.has(current.id)))return
    revision.current++
    setStatus('저장 대기 중…')
    const timer=setTimeout(()=>{if(!locked.current)void flush().catch(()=>{})},700)
    return()=>clearTimeout(timer)
  },[snapshot,current,ready,flush])
  useEffect(()=> {
    const visibility=()=> { if(document.visibilityState==='hidden'&&!locked.current) void flush().catch(()=>{}) }
    const unload=(event: BeforeUnloadEvent)=> { if((latest.current.photos.length || savedIds.current.has(identity.current.id)) && status!=='저장됨'){event.preventDefault();event.returnValue=''} }
    document.addEventListener('visibilitychange',visibility);window.addEventListener('beforeunload',unload)
    return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('beforeunload',unload)}
  },[flush,status])
  async function refresh() { setItems(await listProjects()) }
  async function show() { await flush(); await refresh(); setOpen(true) }
  async function load(project: Project) { await flush(); const next=hydrate(project); revision.current++; identity.current={id:project.id,name:project.name};setCurrent(identity.current);latest.current=next;restoreRef.current(next);setOpen(false);setStatus('저장됨') }
  async function rename(project: Project,name: string) { if(!name.trim())return; await flush(); const rows=await listProjects();const fresh=rows.find(p=>p.id===project.id);if(!fresh)return; await saveProject({...fresh,name:name.trim().slice(0,80)}); if(project.id===identity.current.id){identity.current={...identity.current,name:name.trim().slice(0,80)};setCurrent(identity.current)} await refresh() }
  async function duplicate(project: Project) { await flush();const fresh=(await listProjects()).find(p=>p.id===project.id);if(!fresh)return; await saveProject({...fresh,id:crypto.randomUUID(),name:`${fresh.name} 복사`,updatedAt:Date.now()});await refresh() }
  async function remove(project: Project) { await flush(); await deleteProject(project.id); if(project.id===identity.current.id) { identity.current={id:crypto.randomUUID(),name:'새 작업'};setCurrent(identity.current);restoreRef.current({...latest.current,photos:[],placements:Array(latest.current.config.layout.photoCount).fill(null),layouts:{}}) } await refresh() }
  async function backup() { const blob=await projectFile({...identity.current,version:1,updatedAt:Date.now(),thumbnail:'',snapshot:latest.current});const url=URL.createObjectURL(blob), a=document.createElement('a');a.href=url;a.download=`memory-frame-${Date.now()}.memoryframe`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000) }
  async function importFile(file: File) { const project=await readProjectFile(file);await load(project);await saveProject(project);await refresh() }
  function newIdentity() { revision.current++; identity.current={id:crypto.randomUUID(),name:'새 작업'};setCurrent(identity.current);setStatus('이 브라우저에 저장') }
  const guard = <A extends unknown[],>(fn:(...args:A)=>Promise<void>) => async(...args:A) => {
    if(locked.current)return
    locked.current=true;setPending(true)
    try{await fn(...args)}finally{locked.current=false;setPending(false)}
  }
  return {ready,status,items,current,open,setOpen,flush,show:guard(show),load:guard(load),rename:guard(rename),duplicate:guard(duplicate),remove:guard(remove),backup:guard(backup),importFile:guard(importFile),newIdentity,pending}
}
