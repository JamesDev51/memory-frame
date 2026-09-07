import assert from 'node:assert/strict'
import {test} from 'node:test'
import {execFileSync} from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import {pathToFileURL} from 'node:url'
import 'fake-indexeddb/auto'
import React,{act} from 'react'
import {create} from 'react-test-renderer'
const root=await fs.mkdtemp(path.join(os.tmpdir(),'frame-storage-'))
execFileSync('node_modules/.bin/tsc',['src/utils/projects.ts','src/hooks/useEditorHistory.ts','src/hooks/useProjects.ts','--ignoreConfig','--target','es2022','--module','esnext','--moduleResolution','bundler','--skipLibCheck','--outDir',root])
await fs.symlink(path.resolve('node_modules'),path.join(root,'node_modules'),'dir')
for(const dir of ['utils','hooks'])for(const file of await fs.readdir(path.join(root,dir)))if(file.endsWith('.js')){const p=path.join(root,dir,file);await fs.writeFile(p,(await fs.readFile(p,'utf8')).replace(/from '(\.[^']+)'/g,"from '$1.js'"))}
const {saveProject,listProjects,deleteProject,hydrate,projectFile,readProjectFile}=await import(pathToFileURL(path.join(root,'utils/projects.js')))
const {newPlacement}=await import(pathToFileURL(path.join(root,'utils/placements.js')))
const config={layout:{id:'grid-4',type:'grid',photoCount:4,rows:2,columns:2,label:'4'},printSize:'A4',orientation:'portrait',gap:.006,shadow:0,frameId:'white',frameVariantId:'white',colorMode:'color',printUse:'frame',mat:'minimal',frameOverlapMm:5,customWidthMm:210,customHeightMm:297}
const photo={id:'source',file:new File(['image bytes'],'a.png',{type:'image/png'}),url:'blob:temporary',naturalWidth:600,naturalHeight:800,scale:1,offsetX:0,offsetY:0,rotation:0,fit:'cover'}
const slot={...newPlacement(photo.id),rotation:90,scale:2}
const snapshot={config,photos:[photo],placements:[slot,null,null,null],layouts:{heart:{layout:{...config.layout,type:'heart'},placements:[{...slot,id:'heart'},null,null,null]}}}
const project={id:'test-project',name:'웨딩 사진',version:1,updatedAt:1,thumbnail:'',snapshot}
globalThis.FileReader=class { readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result=`data:${blob.type};base64,${Buffer.from(b).toString('base64')}`;this.onload()}).catch(e=>this.onerror(e))} }
test('IndexedDB stores actual image bytes and restores independent placement edits',async()=>{
 await saveProject(project); const saved=(await listProjects()).find(p=>p.id===project.id)
 assert.equal(saved.snapshot.photos[0].url,'');assert.equal(await saved.snapshot.photos[0].file.text(),'image bytes')
 const restored=hydrate(saved);assert.match(restored.photos[0].url,/^blob:/);assert.equal(restored.placements[0].rotation,90);assert.equal(restored.layouts.heart.placements[0].scale,2)
 URL.revokeObjectURL(restored.photos[0].url)
 await saveProject({...project,snapshot:{...snapshot,photos:[],placements:[null,null,null,null],layouts:{}}})
 assert.equal((await listProjects()).find(p=>p.id===project.id).snapshot.photos.length,0)
 await deleteProject(project.id);assert.ok(!(await listProjects()).some(p=>p.id===project.id))
})
test('portable backup round trip retains original bytes, slots and layout memory',async()=>{
 const file=await projectFile(project);const imported=await readProjectFile(file)
 assert.notEqual(imported.id,project.id);assert.equal(await imported.snapshot.photos[0].file.text(),'image bytes')
 assert.deepEqual(imported.snapshot.placements,project.snapshot.placements)
 assert.deepEqual(imported.snapshot.layouts,project.snapshot.layouts)
})
test('invalid backups are rejected before they can replace the working document',async()=>{
 const valid=JSON.parse(await(await projectFile(project)).text())
 for(const mutate of [p=>p.version=99,p=>p.snapshot.placements[0].photoId='missing',p=>p.snapshot.placements[0].scale=100,p=>p.snapshot.config.layout.rows=500,p=>p.snapshot.config.cardBorder=2]) {
  const data=structuredClone(valid);mutate(data);await assert.rejects(readProjectFile(new Blob([JSON.stringify(data)])))
 }
})
const {useEditorHistory}=await import(pathToFileURL(path.join(root,'hooks/useEditorHistory.js')))
const {useProjects}=await import(pathToFileURL(path.join(root,'hooks/useProjects.js')))
globalThis.IS_REACT_ACT_ENVIRONMENT=true
globalThis.document={querySelector:()=>null,addEventListener(){},removeEventListener(){},visibilityState:'visible'}
globalThis.window={addEventListener(){},removeEventListener(){}}
test('mounted editor groups a gesture, saves latest state, loads and deletes a project',async()=>{
 let h,m,renderer
 function Harness(){h=useEditorHistory(config);m=useProjects(h.snapshot,s=>h.setSnapshot(s,true));return null}
 await act(async()=>{renderer=create(React.createElement(Harness))})
 for(let i=0;!m.ready && i<50;i++) await act(async()=>{await new Promise(resolve=>setImmediate(resolve))})
 assert.equal(m.ready,true)
 await act(async()=>{h.setSnapshot(snapshot,true)})
 await act(async()=>{h.beginGroup();h.setPlacements(p=>p.map((s,i)=>i===0?{...s,scale:2.1}:s))})
 await act(async()=>{h.setPlacements(p=>p.map((s,i)=>i===0?{...s,scale:2.4}:s));h.endGroup()})
 await act(async()=>h.undo());assert.equal(h.placements[0].scale,2)
 await act(async()=>h.redo());assert.equal(h.placements[0].scale,2.4)
 await act(async()=>m.flush());assert.equal(m.status,'저장됨')
 const saved=(await listProjects()).find(p=>p.id===m.current.id);assert.equal(saved.snapshot.placements[0].scale,2.4)
 await act(async()=>m.duplicate(saved));assert.equal((await listProjects()).length,2)
 await act(async()=>m.rename(saved,'본식 액자'));assert.equal(m.current.name,'본식 액자')
 await act(async()=>{h.setPhotos([]);h.setPlacements([null,null,null,null])})
 await act(async()=>m.flush());assert.equal((await listProjects()).find(p=>p.id===m.current.id).snapshot.photos.length,0)
 const copy=(await listProjects()).find(p=>p.id!==m.current.id)
 await act(async()=>m.load(copy));assert.equal(h.photos.length,1);assert.equal(h.placements[0].scale,2.4)
 await act(async()=>m.remove(copy));assert.equal(h.photos.length,0);assert.ok(!(await listProjects()).some(p=>p.id===copy.id))
 await act(async()=>renderer.unmount())
})

test('storage failure keeps the edited document and retry saves it',async()=>{
 let h,m,renderer
 function Harness(){h=useEditorHistory(config);m=useProjects(h.snapshot,s=>h.setSnapshot(s,true));return null}
 await act(async()=>{renderer=create(React.createElement(Harness))})
 for(let i=0;!m.ready && i<50;i++) await act(async()=>{await new Promise(resolve=>setImmediate(resolve))})
 assert.equal(m.ready,true)
 await act(async()=>h.setSnapshot(snapshot,true))
 const original=IDBObjectStore.prototype.put
 IDBObjectStore.prototype.put=function(){throw new DOMException('full','QuotaExceededError')}
 try {await act(async()=>{await assert.rejects(m.flush())});assert.match(m.status,/저장 실패/);assert.equal(h.placements[0].rotation,90)}finally{IDBObjectStore.prototype.put=original}
 await act(async()=>m.flush());assert.equal(m.status,'저장됨')
 await act(async()=>renderer.unmount())
})
