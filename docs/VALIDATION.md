# V1.2 validation

## Completed before deployment
- Production build passes with installed dependencies recorded in package-lock.json.
- Geometry tests: 288 layout/count/gap/paper/orientation combinations; exact counts, square tiles, no overlaps, within page.
- Cover bounds and contain completeness across portrait/landscape/square sources, zoom and extreme offsets.
- A2 300 DPI: 4961 x 7016 px; orientation swap; source DPI decreases with zoom / paper enlargement.
- Code review: image ownership includes undo/redo, sequential export draws, released canvases, grayscale fallback when Canvas filter is unavailable; no photo-upload requests.

## Pending / limitations
- Local browser preview is blocked by browser infrastructure (ERR_BLOCKED_BY_CLIENT despite healthy server).
- Deployed browser interaction and actual download checks pending; this record will be updated after deployment.
- Physical iOS Safari devices and physical printer output are not covered by desktop browser checks.
