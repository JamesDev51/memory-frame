# V1.2 implementation and verification plan

Approved scope: preserve beginner-first, local-only React/Vite app and existing GitHub/Vercel deployment.

1. Shared rendering: one normalized geometry model and Canvas drawing path for preview, photo adjustment, PNG and PDF. Identical padding, gap, pattern, shadow, crop and monochrome behavior. Source image cover/contain with clamped panning and actual slot aspect ratio.
2. Heart: six count-specific square-tile compositions; no diagonal clipping. Recommend 12/16/20; explain low-count silhouette limitation. Preserve three gap presets.
3. Print: A5/A4/A3/A2, portrait/landscape independent of grid orientation; A4 default. Full-color / photos-only grayscale / whole-poster grayscale. Export preview and effective source DPI warnings including zoom. 300 DPI default; explicit 150 DPI fallback, never silently reduce quality. Sequential image rendering and canvas cleanup for memory.
4. Recovery: bounded undo/redo including removed/replaced photos, photo reset, partial upload success, empty-slot confirmation, actionable export failure without state loss. Defer persistent project storage and sharing.
5. Verification: build; geometry/crop/DPI tests across all counts and gaps; mobile and desktop browser flows including editing, history, failure recovery, grayscale, paper orientation; PNG/PDF sizes and representative visual parity; A2 generation. Fix observed defects and repeat affected tests.
6. Delivery: update README/PRD/decisions/context and validation record, commit and push GitHub, wait for Vercel production READY at the same commit, repeat representative live flows. Report environment/device limitations honestly.

Acceptance: all tiles inside page, no overlap, all six counts exact; contain shows original; cover never reveals blank edges; undo restores edits and photo resources; exported layout matches preview; paper dimensions correct; no photo uploads. Browser emulation does not establish physical iPhone/printer compatibility.
