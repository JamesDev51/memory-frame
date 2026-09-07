import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'memory-frame-test-'))
execFileSync('node_modules/.bin/tsc', ['src/utils/geometry.ts', '--ignoreConfig', '--target', 'es2022', '--module', 'esnext', '--moduleResolution', 'bundler', '--skipLibCheck', '--outDir', root])
const geometryPath = path.join(root, 'utils/geometry.js')
await fs.writeFile(geometryPath, (await fs.readFile(geometryPath, 'utf8')).replace("'../presets/layouts'", "'../presets/layouts.js'"))
const { getLayoutPreset, PHOTO_COUNTS } = await import(pathToFileURL(path.join(root, 'presets/layouts.js')))
const { slotsFor, paper, photoPlacement, photoDpis } = await import(pathToFileURL(path.join(root, 'utils/geometry.js')))
const base = { frameId: 'white', frameVariantId: 'white', shadow: 'off', colorMode: 'color' }
test('all 288 combinations have exact count, square non-overlapping tiles within the page', () => {
  for (const type of ['grid', 'heart']) for (const count of PHOTO_COUNTS) for (const gap of ['narrow', 'normal', 'wide']) for (const printSize of ['A5', 'A4', 'A3', 'A2']) for (const orientation of ['portrait', 'landscape']) {
    const config = { ...base, layout: getLayoutPreset(type, count), gap, printSize, orientation }
    const page = paper(config), slots = slotsFor(config, page.width, page.height)
    assert.equal(slots.length, count)
    for (const [i, r] of slots.entries()) {
      assert.ok(r.width > 0 && r.height > 0)
      assert.ok(Math.abs(r.width - r.height) < 1e-6)
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
