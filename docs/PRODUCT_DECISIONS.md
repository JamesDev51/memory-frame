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

## V1.3 feedback-driven revision — 2026-09-07

반복 다중 업로드와 별도 사진관리, 고정 칸 드래그/탭 교체를 승인된 후속 구현 범위로 반영했다. 자유 캔버스 배치가 아니라 기존 Grid/Heart 칸 안에서만 재배치한다. 원본 보관함과 슬롯 ID 배열을 분리해 칸 감소 시 사진 손실을 방지한다. 실제 액자에 넣는 용도를 고려해 종이 배경(인쇄)과 액자 외형(미리보기)을 구분한다. 인치/맞춤 종이와 가림 여유를 제공한다. 별도 매트 창 맞춤 및 웨딩 텍스트 템플릿은 추후 제안 범위다.

## V1.4 — 용지를 채우는 그리드 (2026-09-07)

그리드의 정사각형 고정을 해제하고 용지 내부 사각 영역을 직사각형 사진 칸으로 채운다. 네 방향 바깥 여백과 가로·세로 사진 간격은 동일하다. 기본은 좁은 간격 + 최소 액자 안전 여백이며, 편집 화면에서 ‘꽉 채우기 / 여백 있게’를 선택할 수 있다. 기본 세로 용지에 맞춰 6/12/20장은 각각 2열×3행 / 3열×4행 / 4열×5행으로 시작한다. 행열 전환 기능은 유지한다. 하트는 기존 실루엣을 유지한다. 미리보기·사진 조정·PNG/PDF는 공통 칸 계산을 사용한다. 칸 채우기는 원본 일부를 자를 수 있으며 사진 전체 보기 옵션을 유지한다.

## V1.5 — 포토테이블 기본값과 열린 편집 화면

흰 배경, 인쇄 그림자 OFF, 좁은 간격, 최소 액자 안전 여백을 기본으로 설정하고 추천 스타일 적용 버튼을 추가했다. 그리드 1/2장을 지원하고 A5 1~4장, A4 4~6장, A3 6~12장을 디자인 가이드로 안내한다. 하트는 4장 이상만 지원하며 1/2장 그리드에서 전환 시 4칸으로 확장하고 사진은 유지한다.

사진 보관함은 파일명을 표시하지 않고 큰 썸네일의 여러 열 목록, 배치 칸 배지, 편집/삭제 버튼으로 구성한다. 접근성 이름은 사진 번호를 사용한다. 사진 조정은 모달을 제거하고 전체 미리보기 아래 인라인 영역으로 옮겼다. 편집 중 전체 포스터는 작게 고정되어 스크롤하며 변경을 볼 수 있다. 페이지 스크롤 및 다른 칸 선택을 차단하지 않는다. 저장 설정만 모달이다. 실제 액자 외형/그림자는 미리보기 전용이다.

## V1.6 — 수동 배치와 간격 슬라이더

최신 사용자 요청으로 이전 자동 배치 및 간격 3단계 제한을 변경한다. 최초/추가 업로드는 보관함에만 저장하고 슬롯을 자동으로 채우지 않는다. 자동 채우기 버튼도 제거한다. 직접 드래그 또는 사진/칸 선택을 통해서만 배치한다. 보관함은 전체/사용 중/미사용 필터와 상태 배지로 구분한다. 배치된 칸 우측 상단 ×는 슬롯만 비우며 원본을 유지한다. 미리보기 컨트롤은 출력에 포함하지 않는다.

간격은 용지 짧은 변의 0~2.6% 범위 슬라이더(27단계)로 변경하고 선택한 용지의 mm 값을 표시한다. 기존 프리셋은 추천 스타일 내부 값으로 호환 유지한다.
