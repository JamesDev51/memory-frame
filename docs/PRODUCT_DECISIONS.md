# Memory Frame — Product Decision Log

This document is a compact list of accepted / rejected product decisions. Use it to avoid reopening already-settled questions in future sessions unless new user feedback justifies a change.

---

## Accepted decisions

### Product positioning

- Build a **very easy photo frame / collage maker**, not a general design editor.
- Optimize for beginners and mobile users arriving from social media.
- Main value is easy access to an attractive result, not technical sophistication.
- Target first usable result in about 30 seconds.

### Architecture

- Frontend only.
- No application server.
- No DB.
- No login / accounts in V1.
- No server-side photo upload/storage.
- Photos stay on-device and are processed in the browser.
- Static deployment on Vercel.

### Primary layout modes

- Grid.
- Heart.

### Photo-count presets

- 4 / 6 / 9 / 12 / 16 / 20.

### Grid behavior

- Automatically derive rows / columns from photo count.
- Allow a one-click portrait/landscape swap for non-square grids.
- Keep arbitrary row/column inputs out of V1.

### Heart behavior

- Heart is an opinionated preset composition.
- No user-facing row/column controls for Heart.
- Heart must be formed by arranging intact photo tiles, not by clipping a rectangular grid with a heart mask.
- Have tuned layouts per photo count.
- Preview and exported PNG/PDF must use equivalent Heart composition rules.

### Gap

- Keep gap adjustment.
- Expose only: 좁게 / 기본 / 넓게.
- No pixel input or continuous V1 slider.

### Frames

Core V1 frame styles:

- White
- Ivory
- Black
- Dot
- Check

Treat “frame” as a simple user-facing concept rather than exposing many technical layers.

### Dot variants

- Red × White
- Black × White
- Pink × White
- Ivory × Black

Use curated combinations rather than a free color picker.

### Check variants

- Red
- Black
- Beige

### Pattern controls

- Product owns pattern size / spacing.
- User does not adjust dot size, dot spacing, check thickness, etc. in V1.

### Shadow

- Include shadow.
- User sees ON / OFF only.
- Product owns blur / opacity / offsets.

### Photo editing

Include:

- position adjustment,
- zoom,
- replace,
- delete,
- reorder.

Do not make V1 a full photo editor.

### Export

- High-resolution PNG.
- Print PDF.
- A5 / A4 / A3.
- Target print-quality / approximately 300 DPI rendering.
- Generate export locally in browser.
- No watermark requirement for V1.

### Progressive disclosure

- Show only essential controls first.
- Less common layout adjustments can be under “배치 조금 더 바꾸기” or equivalent.

---

## Explicitly rejected / deferred decisions

### Card layout

Rejected from V1.

Reason: unnecessary mental model and adds complexity. Playing-card aesthetics may become a later specialized template.

### Canva-style editor

Rejected.

Do not add V1 features such as:

- free-placement canvas,
- layer panel,
- unrestricted movable text boxes,
- stickers,
- drawing tools,
- arbitrary alignment / x-y controls.

### Arbitrary row / column fields

Rejected for V1.

Reason: users should choose photo count, and the product should choose a good arrangement.

### Free color picker for patterns

Rejected for V1.

Reason: curated combinations are easier and produce safer visual results.

### Advanced shadow editor

Rejected for V1.

### Pattern size / spacing editor

Rejected for V1.

### Full text editor

Deferred.

If added later, favor template-defined fields (names, date, title) rather than a free design tool.

### Backend / cloud save

Deferred and contrary to current V1 architecture unless explicitly reconsidered later.

### Physical product ordering / checkout

Out of current V1 scope.

---

## Important feedback-driven change

### Heart v1 → Heart v1.1

**Before:**

- rectangular grid,
- global heart clip mask,
- edge photos visibly cut / diagonal.

**User feedback:**

- overall app design was acceptable,
- Heart was disappointing,
- too much of the photos was cut away.

**After decision:**

- preserve rectangular photo tiles,
- arrange the tiles into the Heart silhouette,
- maintain gap controls,
- build count-specific Heart compositions,
- update export renderer as well as preview.

Do not regress to the old global clipping approach.

---

## Feature decision test

Before introducing a future feature, answer:

- Does this make it easier for a beginner to get a good result?
- Can it be a preset instead of a control?
- Does the first screen stay simple?
- Does it preserve local-only photo processing?
- Did users ask for it, or is it just easy to engineer?

Prefer fewer, better choices.

## V1.2 approved additions — 2026-09-06

User approved implementation, review, GitHub push and Vercel production testing of the proposed revision. Added A2 and paper orientation, three color modes, effective print DPI warnings, contain/cover, reset, undo/redo, partial upload recovery and empty-slot confirmation. Keep all controls in focused photo/print sheets. Original row/column and free-color-picker exclusions remain. Persistent continuation and sharing remain deferred. See PRD section 28.
