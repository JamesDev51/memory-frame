# V1.2 validation — 2026-09-07

## Automated checks
- Production build passes; dependency versions are captured in package-lock.json; CI uses npm ci and runs tests before build.
- 7 tests pass:
  - 288 layout/count/gap/paper/orientation combinations: exact counts, square tiles, no overlaps, inside paper bounds.
  - Cover never exposes empty edges; contain retains the entire source for portrait, landscape and square photos across zoom and extreme offsets.
  - A2 300 DPI dimensions (4961 x 7016), orientation swap and effective source-DPI changes.
  - Undo/redo retains deleted/replaced photos and fit settings; count reduction restores layout and photos together; 40-checkpoint limit and redo-branch clearing.
- Code review: same geometry and Canvas photo renderer across preview/adjustment/export; sequential export image draws; released export canvases; grayscale fallback where Canvas filter is unavailable; no photo-upload requests in application code.

## Production deployment and actual browser checks
Implementation commit c9d4060c8b3cb7819fefb7d4cb7a45307f917ef7:
- GitHub CI success: https://github.com/JamesDev51/memory-frame/actions/runs/34068507532
- GitHub Vercel status: success / Deployment has completed.
- GitHub deployment record: Production / success, environment URL https://memory-frame-hjjcd0bfb-minseokjeongjames-4193s-projects.vercel.app
- Production app tested: https://memory-frame-nine.vercel.app
- Loaded updated UI, chose Heart / 12, selected 12 generated PNG fixtures through the real file picker, inspected rendered square-tile Heart.
- Opened photo 1, enabled whole-photo fit, visually confirmed all four source borders and the disabled zoom slider.
- Selected dot frame, A2, landscape and photos-only grayscale in the print sheet. Successfully generated and downloaded a PDF via the app. File inspection: one page, 594 x 420 mm; embedded raster 7016 x 4961. Visually reviewed raster: photos grayscale, red dot frame remains colored, whole-photo setting preserved.
- Selected A5, portrait, all-gray and saved PNG via the app. Actual file: 1748 x 2480; maximum R-G and G-B differences both zero (fully grayscale).
- Deleted a test photo: visible photo count changed from 12 to 11.

## Scope and infrastructure limitations
- Local agent preview was healthy but cloud browser navigation to it was blocked (ERR_BLOCKED_BY_CLIENT). Production UI was used instead.
- Browser download-event notification timed out even though the generated PDF was actually downloaded and inspected successfully.
- During later undo/redo and empty-slot confirmation checks, the browser connection timed out/reset. These browser scenarios were not conclusively verified. Core history logic is covered by automated tests; this does not substitute for completed UI checks.
- Physical mobile Chrome / iOS Safari, responsive device emulation, drag gestures, mixed-validity uploads and physical printer output remain unverified in this session. These limitations must not be described as passed.
- Final follow-up only extracts unchanged history transformations into tested functions and updates documentation. It does not change poster rendering or export behavior.

## V1.3 validation — 2026-09-07

- `npm test`: 12 tests pass. 1,512 layout/count/gap/paper/mat/orientation combinations satisfy square tiles, no overlap and page bounds.
- Placement tests: swap vs replace, unused-photo retention, automatic empty fill, count shrinking, null-slot preservation, bank+placement undo checkpoints.
- `npm run build`: pass.
- Local preview starts healthy but cloud browser returns ERR_BLOCKED_BY_CLIENT for terminal.local:4173. Production browser verification follows deployment.
- Physical printer and physical frame fit are not tested. Mobile device/desktop drag interaction status will be recorded separately from pure placement tests.
