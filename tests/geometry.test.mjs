import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'memory-frame-test-'))
execFileSync('node_modules/.bin/tsc', ['src/utils/geometry.ts', 'src/utils/history.ts', 'src/utils/placements.ts', '--ignoreConfig', '--target', 'es2022', '--module', 'esnext', '--moduleResolution', 'bundler', '--skipLibCheck', '--outDir', root])
const geometryPath = path.join(root, 'utils/geometry.js')
await fs.writeFile(geometryPath, (await fs.readFile(geometryPath, 'utf8')).replace("'../presets/layouts'", "'../presets/layouts.js'"))
const { getLayoutPreset, PHOTO_COUNTS } = await import(pathToFileURL(path.join(root, 'presets/layouts.js')))
const { slotsFor, paper, photoPlacement, photoDpis, safeMarginMm } = await import(pathToFileURL(path.join(root, 'utils/geometry.js')))
const base = { frameId: 'white', frameVariantId: 'white', shadow: 'off', colorMode: 'color' }
test('all 1512 combinations have exact count, non-overlapping tiles within the page', () => {
  for (const type of ['grid', 'heart']) for (const count of PHOTO_COUNTS) for (const gap of ['narrow', 'normal', 'wide']) for (const printSize of ['A5', 'A4', 'A3', 'A2', '5x7', '8x10', 'custom']) for (const mat of ['minimal', 'normal', 'wide']) for (const orientation of ['portrait', 'landscape']) {
    const config = { ...base, layout: getLayoutPreset(type, count), gap, printSize, orientation, mat, printUse: 'frame', frameOverlapMm: 8, customWidthMm: 80, customHeightMm: 600 }
    const page = paper(config), slots = slotsFor(config, page.width, page.height)
    assert.equal(slots.length, count)
    for (const [i, r] of slots.entries()) {
      assert.ok(r.width > 0 && r.height > 0)
      if (type === 'heart') assert.ok(Math.abs(r.width - r.height) < 1e-6)
      assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.width <= page.width && r.y + r.height <= page.height)
      for (const s of slots.slice(i + 1)) assert.ok(r.x + r.width <= s.x + 1e-6 || s.x + s.width <= r.x + 1e-6 || r.y + r.height <= s.y + 1e-6 || s.y + s.height <= r.y + 1e-6, `${type} ${count} ${gap}: overlap`)
    }
  }
})
test('cover never reveals gaps; contain retains the whole image despite previous edits', () => {
  for (const [naturalWidth, naturalHeight] of [[600, 1800], [1800, 600], [1000, 1000]]) for (const scale of [1, 1.5, 2.5]) for (const offsetX of [-1, 0, 1]) for (const offsetY of [-1, 0, 1]) {
    const photo = { naturalWidth, naturalHeight, scale, offsetX, offsetY }
    const cover = photoPlacement({ ...photo, fit: 'cover' }, 400, 400)
    assert.ok(cover.x <= 1e-6 && cover.y <= 1e-6 && cover.x + cover.width >= 400 - 1e-6 && cover.y + cover.height >= 400 - 1e-6)
    const contain = photoPlacement({ ...photo, fit: 'contain' }, 400, 400)
    assert.ok(contain.x >= 0 && contain.y >= 0 && contain.x + contain.width <= 400 + 1e-6 && contain.y + contain.height <= 400 + 1e-6)
  }
})
test('A2 is 4961 × 7016 at 300 DPI; landscape swaps dimensions', () => {
  assert.deepEqual(paper({ printSize: 'A2', orientation: 'portrait' }), { widthMm: 420, heightMm: 594, width: 4961, height: 7016 })
  assert.equal(paper({ printSize: 'A2', orientation: 'landscape' }).width, 7016)
})
test('effective DPI decreases with enlargement and larger paper', () => {
  const config = { ...base, layout: getLayoutPreset('grid', 4), gap: 'normal', printSize: 'A4', orientation: 'portrait' }
  const photo = { naturalWidth: 1200, naturalHeight: 1200, scale: 1, offsetX: 0, offsetY: 0, fit: 'cover' }
  const normal = photoDpis(config, [photo])[0]
  assert.ok(photoDpis(config, [{ ...photo, scale: 2 }])[0] < normal)
  assert.ok(photoDpis({ ...config, printSize: 'A2' }, [photo])[0] < normal)
})

const { updateHistory, undoHistory, redoHistory } = await import(pathToFileURL(path.join(root, 'utils/history.js')))
test('undo and redo preserve removed/replaced photo resources and fit settings', () => {
  const a = { id: 'a', url: 'blob:a', fit: 'contain' }, b = { id: 'b', url: 'blob:b' }
  const initial = { past: [], present: { config: {}, photos: [a, b] }, future: [] }
  const deleted = updateHistory(initial, 'photos', [b], true)
  assert.deepEqual(undoHistory(deleted).present.photos, [a, b])
  assert.deepEqual(redoHistory(undoHistory(deleted)).present.photos, [b])
  const replacement = updateHistory(initial, 'photos', [{ ...a, url: 'blob:new' }, b], true)
  assert.equal(undoHistory(replacement).present.photos[0].url, 'blob:a')
})
test('a grouped count reduction restores both layout and photos in one undo', () => {
  const photos = Array.from({length:12}, (_,i) => ({id:String(i), url:`blob:${i}`}))
  const initial = { past: [], present: { config: { count: 12 }, photos }, future: [] }
  const removed = updateHistory(initial, 'photos', photos.slice(0,4), true)
  const changed = updateHistory(removed, 'config', {count:4}, false)
  assert.deepEqual(undoHistory(changed).present, initial.present)
  assert.deepEqual(redoHistory(undoHistory(changed)).present, changed.present)
})
test('history is bounded and a new edit after undo clears the redo branch', () => {
  let h = { past: [], present: { config: {n:0}, photos: [] }, future: [] }
  for(let i=1;i<=60;i++) h=updateHistory(h,'config',{n:i},true)
  assert.equal(h.past.length,40)
  h=undoHistory(h)
  assert.equal(h.present.config.n,59)
  h=updateHistory(h,'config',{n:100},true)
  assert.equal(h.future.length,0)
  assert.equal(redoHistory(h).present.config.n,100)
})

const { resizePlacements, placePhoto, fillEmpty, arrangedPhotos } = await import(pathToFileURL(path.join(root, 'utils/placements.js')))
test('placing library photos replaces one slot without losing the old library item', () => {
  const photos = ['a', 'b', 'c', 'd'].map(id => ({ id, url: `blob:${id}` }))
  assert.deepEqual(placePhoto(['a','b',null], 'c', 1), ['a','c',null])
  assert.equal(photos.length,4)
  assert.deepEqual(placePhoto(['a','b',null], 'a', 1), ['b','a',null])
  assert.deepEqual(placePhoto(['a','b',null], 'a', 2), [null,'b','a'])
})
test('multiple add fills empty slots only, retaining all excess images', () => {
  const photos = ['a','b','c','d','e','f'].map(id => ({ id }))
  assert.deepEqual(fillEmpty(['a',null,'c',null],photos), ['a','b','c','d'])
  assert.equal(photos.length,6)
  assert.deepEqual(fillEmpty(['a','b','c','d'],photos), ['a','b','c','d'])
})
test('shrinking layouts never deletes library photos; render keeps slot holes', () => {
  const photos = ['a','b','c','d'].map(id => ({id}))
  const slots = resizePlacements(['a',null,'b','c'],2)
  assert.deepEqual(slots,['a',null])
  assert.deepEqual(arrangedPhotos([null,'b',null,'a'],photos),[null,photos[1],null,photos[0]])
  assert.deepEqual(resizePlacements(slots,4),['a',null,null,null])
  assert.deepEqual(arrangedPhotos(['missing'],photos),[null])
})
test('undo restores the library and placements atomically', () => {
  const original = { past: [], present: { config:{}, photos:[{id:'a',url:'blob:a'}], placements:['a',null] }, future:[] }
  const removed = updateHistory(original,'photos',[],true)
  const emptied = updateHistory(removed,'placements',[null,null],false)
  assert.deepEqual(undoHistory(emptied).present,original.present)
})
test('all frame photos stay beyond the selected overlap even with minimum margins', () => {
  for(const printSize of ['A5','A2','5x7','custom']) {
    const config = { ...base, layout:getLayoutPreset('heart',20), printSize, orientation:'portrait', gap:'wide', mat:'minimal', printUse:'frame', frameOverlapMm:8, customWidthMm:80, customHeightMm:100 }
    const page=paper(config), overlap=8*page.width/page.widthMm
    for(const slot of slotsFor(config,page.width,page.height)) assert.ok(slot.x>=overlap && slot.y>=overlap && slot.x+slot.width<=page.width-overlap && slot.y+slot.height<=page.height-overlap)
  }
})

test('grid fills all four edges with equal margins and identical horizontal/vertical gutters', () => {
  for (const count of PHOTO_COUNTS) for (const printSize of ['A5','A4','A3','A2','5x7','8x10','custom']) for (const orientation of ['portrait','landscape']) for (const mat of ['minimal','normal','wide']) for (const gap of ['narrow','normal','wide']) for (const swap of [false,true]) {
    const layout = {...getLayoutPreset('grid',count)}
    if(swap) [layout.rows,layout.columns]=[layout.columns,layout.rows]
    const config={...base,layout,printSize,orientation,mat,gap,printUse:'frame',frameOverlapMm:5,customWidthMm:180,customHeightMm:320}
    const page=paper(config), slots=slotsFor(config,page.width,page.height), first=slots[0], last=slots.at(-1)
    const margin=safeMarginMm(config)*page.width/page.widthMm
    const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`)
    near(first.x,margin);near(first.y,margin)
    near(page.width-last.x-last.width,margin);near(page.height-last.y-last.height,margin)
    near(slots[1].x-first.x-first.width,slots[layout.columns].y-first.y-first.height)
    const preview=slotsFor(config,900,900*page.height/page.width)
    for(let i=0;i<slots.length;i++) for(const key of ['x','y','width','height']) near(preview[i][key]/900,slots[i][key]/page.width)
  }
})
test('rectangular grid crops fill without gaps and contain preserves the original',()=>{
  for(const [w,h] of [[300,500],[500,300]]) for(const [nw,nh] of [[600,1800],[1800,600],[1000,1000]]) {
    const photo={naturalWidth:nw,naturalHeight:nh,scale:1.5,offsetX:1,offsetY:-1}
    const c=photoPlacement({...photo,fit:'cover'},w,h)
    assert.ok(c.x<=1e-6&&c.y<=1e-6&&c.x+c.width>=w-1e-6&&c.y+c.height>=h-1e-6)
    const f=photoPlacement({...photo,fit:'contain'},w,h)
    assert.ok(f.x>=0&&f.y>=0&&f.x+f.width<=w+1e-6&&f.y+f.height<=h+1e-6)
  }
})
