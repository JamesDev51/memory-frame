import { useEffect, useRef } from 'react'
import type { useProjects } from '../hooks/useProjects'
export default function ProjectManager({manager,onError}: {manager: ReturnType<typeof useProjects>;onError:(message:string)=>void}) {
  const dialog=useRef<HTMLDialogElement>(null), input=useRef<HTMLInputElement>(null)
  useEffect(()=>{if(manager.open)dialog.current?.showModal();else dialog.current?.close()},[manager.open])
  const run=(task:Promise<unknown>)=>void task.catch(e=>onError(e instanceof Error?e.message:'작업을 처리하지 못했어요.'))
  return <dialog className="projects-dialog" ref={dialog} onCancel={e=>{if(manager.pending)e.preventDefault();else manager.setOpen(false)}} onClose={()=>manager.setOpen(false)} aria-label="내 작업">
    <fieldset disabled={manager.pending} style={{border:0,padding:0,margin:0}}><div className="sheet-title-row"><h2>내 작업</h2><button type="button" className="icon-button" aria-label="내 작업 닫기" onClick={()=>manager.setOpen(false)}>×</button></div>
    <p>사진과 편집 내용을 이 브라우저에 보관해요. 다른 기기에서는 작업 파일을 불러와주세요.</p>
    <div className="project-tools"><button className="soft-button" onClick={()=>input.current?.click()}>작업 파일 불러오기</button><button className="soft-button" onClick={()=>run(manager.backup())}>현재 작업 파일 백업</button></div>
    <input hidden ref={input} type="file" accept=".memoryframe,.json" onChange={e=>{const file=e.target.files?.[0];if(file)run(manager.importFile(file));e.target.value=''}} />
    <div className="project-list">{!manager.items.length&&<p>저장된 작업이 없어요. 사진을 추가하면 자동 저장돼요.</p>}{manager.items.map(item=><article key={item.id} className="project-row">
      {item.thumbnail ? <img src={item.thumbnail} alt="저장된 배치"/> : <span className="project-placeholder">M</span>}
      <div><strong>{item.name}</strong><p>{new Date(item.updatedAt).toLocaleString('ko-KR')} · {item.snapshot.config.printSize}</p>
      <div className="project-tools"><button className="soft-button" onClick={()=>run(manager.load(item))}>이어서 편집</button><button className="soft-button" onClick={()=>{const name=window.prompt('작업 이름',item.name);if(name)run(manager.rename(item,name))}}>이름 변경</button><button className="soft-button" onClick={()=>run(manager.duplicate(item))}>복제</button><button className="text-danger" onClick={()=>{if(window.confirm(`‘${item.name}’ 작업을 삭제할까요? 이 삭제는 되돌릴 수 없어요.`))run(manager.remove(item))}}>삭제</button></div></div>
    </article>)}</div>
    </fieldset>{manager.pending&&<p role="status">작업을 처리하고 있어요…</p>}
  </dialog>
}
