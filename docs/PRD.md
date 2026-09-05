# Memory Frame — Canonical PRD

> Status: V1 implemented / iteration in progress  
> Repository: `JamesDev51/memory-frame`  
> Product type: frontend-only static web app  
> Primary deployment target: Vercel  
> Backend/API/DB: **none**

---

## 1. Product summary

Memory Frame is a free, beginner-friendly photo frame / collage maker.

The product is intentionally **not** a Canva-like design tool. The user should not need design knowledge, pixel-level controls, layers, or complicated editing concepts.

The ideal experience is:

> Choose a layout → choose how many photos → pick photos → get a good-looking result immediately → optionally tweak a few simple style controls → save as PNG or print-ready PDF.

The core product promise is:

> **A first-time user should be able to create a good-looking result within about 30 seconds without reading instructions.**

---

## 2. Why this product exists

The product direction came from reviewing `dearly.kr/frame` and multiple wedding / couple photo-board references.

The important insight from the discussion was that users do **not** comment or engage because the software looks technically difficult. They engage because the service turns an annoying design task into an easy shortcut.

The actual user desire is closer to:

> “I want the pretty result I saw on Pinterest / Instagram, but I do not want to learn Canva or spend an hour laying it out.”

Therefore Memory Frame should compete on:

- speed,
- preset quality,
- beginner-friendliness,
- visual result,
- privacy,

rather than on the number of editing features.

---

## 3. Product principles

### 3.1 Results first

The result should appear immediately after photo selection. Users should not have to configure several options before seeing a finished-looking result.

### 3.2 Selection, not design

Prefer simple choices such as:

- 좁게 / 기본 / 넓게
- 그림자 ON / OFF
- 화이트 / 아이보리 / 블랙 / 도트 / 체크

Do **not** expose beginner users to:

- gap in pixels,
- shadow blur / spread / opacity,
- border width numbers,
- dot size / spacing,
- arbitrary layer controls,
- free-form x/y coordinates.

### 3.3 Opinionated defaults

Every layout and frame should have a pre-tuned default that already looks good.

The user should be able to use the default without touching any setting.

### 3.4 Do not become Canva

If a feature makes the service feel like a general-purpose design editor, it should usually be deferred.

### 3.5 Local-only photo processing

Photos must remain on the user’s device.

No user photo should be uploaded to an application server in V1.

---

## 4. Target users

### Primary

- people preparing a wedding,
- couples making photo frames / photo-table prints,
- users who want an easy printable collage.

### Secondary

- anniversaries,
- birthdays,
- travel memories,
- family photos,
- friend-group photos.

The repository name and service should remain broad enough to expand beyond weddings.

---

## 5. Core V1 user flow

```text
Home
  ↓
Choose layout
  - Grid
  - Heart
  ↓
Choose photo count
  - 4
  - 6
  - 9
  - 12
  - 16
  - 20
  ↓
Choose photos from device
  ↓
Auto-generate finished-looking result
  ↓
Optional simple edits
  - frame
  - frame color variant
  - gap
  - shadow
  - photo position / zoom
  - photo order
  ↓
Save
  - high-resolution PNG
  - A5/A4/A3 PDF
```

No login or account flow should appear before creation or export.

---

## 6. Layouts

### 6.1 Grid

Grid is the default structured collage layout.

Supported photo counts:

| Photos | Default grid |
|---:|---:|
| 4 | 2 × 2 |
| 6 | 3 × 2 |
| 9 | 3 × 3 |
| 12 | 4 × 3 |
| 16 | 4 × 4 |
| 20 | 5 × 4 |

For non-square grids, the user may switch portrait / landscape orientation with a single action.

#### Important decision

Do **not** expose arbitrary row / column number inputs in the normal UI.

Users should think in terms of “사진 몇 장” rather than “행 / 열”.

The grid shape is automatically selected from the photo count.

---

### 6.2 Heart

Heart is a signature visual feature and should feel more special than a normal clipped grid.

#### Original implementation problem

The first implementation created a rectangular photo grid and clipped the whole grid using a heart-shaped mask.

This caused edge photos to be visibly cut into triangles / partial shapes, especially noticeable on people’s faces.

#### Canonical implementation decision

**Heart must be a heart-shaped arrangement of intact photo tiles, not a heart-shaped mask clipping a normal grid.**

Each photo tile should remain rectangular as much as possible.

The overall positions of the photo tiles should form the heart silhouette.

Heart layouts are opinionated presets for each supported photo count:

- 4
- 6
- 9
- 12
- 16
- 20

The layout may use different tile sizes / row structures to make the silhouette look balanced.

Users should **not** be given row / column controls for Heart.

The service owns the heart composition and should tune it for visual quality.

#### Heart quality bar

When evaluating the heart layout, prioritize:

1. photos should not be sliced diagonally,
2. faces should remain readable,
3. top lobes should look like a heart,
4. bottom should taper naturally,
5. the composition should not be excessively tall or narrow,
6. gaps should still work consistently,
7. preview and PNG/PDF export must match.

---

## 7. Photo count presets

Supported counts in V1:

- 4
- 6
- 9
- 12
- 16
- 20

Use large, simple buttons.

Do not ask the user to type a number.

When the user changes to a smaller count after already selecting photos, warn that extra photos will be removed.

---

## 8. Photo upload

### Requirements

- multi-select from mobile gallery,
- desktop file picker,
- support common browser-decodable image formats such as JPG/JPEG, PNG, WEBP,
- selected images are processed locally,
- selected photos are immediately placed into the chosen layout.

The UI should explicitly communicate:

> 사진은 서버에 업로드되지 않아요.

or equivalent copy.

---

## 9. Automatic cropping

The normal default should be cover-style cropping.

Users should not need to adjust every photo.

Only photos that look wrong should require manual correction.

---

## 10. Individual photo adjustment

When a photo is tapped / clicked, open a focused beginner-friendly adjustment UI.

V1 controls:

- drag photo position,
- zoom in / out,
- replace photo,
- delete photo,
- move photo earlier / later in the arrangement.

Optional / already supported internally:

- 90-degree rotation if needed.

Avoid advanced photo-editing features such as:

- brightness,
- saturation,
- filters,
- face retouching,
- arbitrary rotation angles.

---

## 11. Photo order

Desktop:

- drag and drop should reorder photo tiles.

Mobile:

- the photo adjustment UI may offer front / back movement,
- avoid requiring precision drag-and-drop if mobile behavior is unreliable.

---

## 12. Gap control

Gap adjustment **should remain in the product** because it changes the overall visual feel significantly while staying simple.

Expose exactly three beginner-friendly presets:

- 좁게
- 기본
- 넓게

Do not expose pixels or a free slider in V1.

The gap setting must work for both Grid and Heart.

---

## 13. Frame system

The product uses “프레임” as one simple concept. Users should not need to understand separate concepts such as border, outer mat, pattern layer, etc.

V1 frame categories:

- White
- Ivory
- Black
- Dot
- Check

The UI should show visual thumbnails rather than requiring users to infer style from text.

---

## 14. Pattern frame variants

### Dot

V1 color combinations:

- Red × White
- Black × White
- Pink × White
- Ivory × Black

### Check

V1 combinations:

- Red
- Black
- Beige

#### Important decision

Do not expose a full color picker in V1.

Users choose from pre-designed color combinations.

Also do not expose:

- dot size,
- dot spacing,
- check line width,
- check spacing.

These are preset design values owned by the product.

---

## 15. Shadow

Shadow is a high-value finishing effect with low UX complexity.

Expose only:

- ON
- OFF

Do not expose blur / offset / opacity / spread controls.

Default may be ON with a subtle shadow.

---

## 16. Background / frame relationship

The V1 product treats the selected frame preset as the primary outer visual style.

Solid frames:

- White
- Ivory
- Black

Pattern frames provide both their base color and their pattern.

Avoid adding a second complicated independent background editor unless a real user need appears.

---

## 17. Text

Free text editing is **out of scope for current V1**.

Earlier brainstorming included names / dates, but the product direction was simplified further to keep the editor beginner-friendly.

If text is introduced later, prefer template-defined fields such as:

- names,
- wedding date,
- short title,

rather than arbitrary movable text boxes.

---

## 18. Save / export

### 18.1 PNG

Provide high-resolution PNG export.

The exported file should be rendered from source photos, not from a low-resolution screenshot of the on-screen preview.

### 18.2 PDF

Provide print-ready PDF export for:

- A5
- A4
- A3

Target dimensions:

| Size | Physical | 300-DPI target |
|---|---|---|
| A5 | 148 × 210 mm | ~1748 × 2480 px |
| A4 | 210 × 297 mm | ~2480 × 3508 px |
| A3 | 297 × 420 mm | ~3508 × 4961 px |

A4 can be shown as the recommended general-purpose option.

The generated PDF must be created entirely in the browser.

Current implementation uses `jsPDF` with a high-resolution canvas render.

### Export parity requirement

Preview, PNG, and PDF must use the same layout semantics.

If Heart is changed, both preview rendering and export rendering must be updated together.

---

## 19. Privacy and architecture

### Hard V1 constraint

There is **no application backend**.

Do not introduce the following unless the product direction explicitly changes:

- API server,
- DB,
- image upload storage,
- user account server,
- login,
- cloud project storage.

Architecture:

```text
User selects local files
  ↓
Browser File API / Object URLs
  ↓
React editor state
  ↓
Canvas rendering
  ↓
PNG / jsPDF
  ↓
Local download
```

This is also a product trust point, not only a technical choice.

---

## 20. Technical stack

Current stack:

- React
- TypeScript
- Vite
- jsPDF
- browser Canvas API
- Vercel static deployment
- GitHub Actions build verification

No Next.js requirement exists for V1.

---

## 21. Mobile-first UX

Most expected users will arrive from Instagram / mobile social media.

Requirements:

- mobile-first responsive layout,
- large touch targets,
- easy access to gallery picker,
- bottom-sheet style focused editing where appropriate,
- preview should remain large enough to judge the output,
- avoid a long wall of settings,
- do not expose advanced settings until needed.

Desktop should remain fully usable, especially for drag-and-drop ordering.

---

## 22. Progressive disclosure

The default editor should show only the most useful controls.

Recommended visible controls:

- Frame
- Gap
- Shadow
- Save

Less common layout controls belong under something like:

> 배치 조금 더 바꾸기

Inside advanced / secondary controls:

- photo count,
- Grid orientation switch,
- Grid / Heart switch.

Do not place arbitrary row / column inputs here unless later user testing proves they are needed.

---

## 23. Explicitly out of scope for V1

- arbitrary free canvas,
- Canva-style layer panel,
- unrestricted text boxes,
- stickers,
- drawing / doodle tool,
- arbitrary x/y placement UI,
- arbitrary row / column number fields,
- free color picker,
- advanced pattern settings,
- advanced shadow settings,
- AI image editing,
- photo filters,
- accounts / login,
- cloud save,
- collaboration,
- payments,
- physical frame ordering,
- server-side photo handling.

---

## 24. Acceptance criteria

A V1 build is considered product-complete when:

1. A user can use the service without login.
2. No selected photo is uploaded to an app server.
3. Grid and Heart layouts are selectable.
4. 4/6/9/12/16/20 photo-count presets are available.
5. Photos can be selected in bulk.
6. Photos appear in a finished-looking layout immediately after selection.
7. Users can adjust individual photo position and zoom.
8. Users can replace and delete photos.
9. Users can reorder photos.
10. Gap can be set to narrow / normal / wide.
11. White / Ivory / Black / Dot / Check frame presets exist.
12. Dot and Check provide curated color variants.
13. Shadow can be toggled ON/OFF.
14. Grid orientation can be swapped when meaningful.
15. Heart does not rely on diagonal clipping of edge photos.
16. Heart tile positions form the heart silhouette while keeping photos substantially intact.
17. Preview and export layouts match.
18. High-resolution PNG export works.
19. A5/A4/A3 PDF export works locally in the browser.
20. Mobile Chrome / Safari user flow is practical for first-time users.
21. The first usable result should require no advanced configuration.

---

## 25. Product success metric

The most important qualitative metric is not “number of features.”

The product should make users feel:

> “I just put my photos in and it already looks good.”

A useful quantitative north-star for future analytics is:

> Time to first usable result: **~30 seconds or less**

Other possible future metrics:

- start → photo selection rate,
- photo selection → export completion rate,
- PNG vs PDF export share,
- template / frame usage,
- drop-off before first result.

Analytics should never require uploading user photos.

---

## 26. V1.1 / later ideas — only after real feedback

Potential follow-ups, not current requirements:

- more curated frame presets,
- additional pattern combinations,
- improved heart compositions,
- simple photo-strip grid presets,
- wedding-specific template family,
- childhood photo welcome board,
- guest signature board,
- photo-table poster,
- names / date fields as template-defined text,
- local IndexedDB project continuation.

Do not implement these simply because they are possible. Add only when they preserve the beginner-first promise.

---

## 27. Canonical decision rule for future sessions

When a future development session is unsure whether to add a feature, ask:

1. Does this help a beginner reach a good result faster?
2. Can it be a curated preset instead of a free-form control?
3. Does it keep the initial UI simple?
4. Does it preserve local-only photo processing?
5. Is this something users actually asked for, or merely something developers can build?

If the answer is weak, defer the feature.
