# Memory Frame

Live: https://memory-frame-nine.vercel.app

서버 없이 브라우저에서만 동작하는 초간단 포토 프레임 메이커입니다.

## Read this first

새 세션에서 이 프로젝트를 이어서 작업할 때는 아래 문서를 먼저 읽어주세요.

1. [`docs/SESSION_CONTEXT.md`](docs/SESSION_CONTEXT.md) — 처음 아이디어부터 현재 결정까지의 대화 맥락 / 핸드오프
2. [`docs/PRD.md`](docs/PRD.md) — 현재 기준 canonical V1 PRD
3. [`docs/PRODUCT_DECISIONS.md`](docs/PRODUCT_DECISIONS.md) — 확정 / 제외 / 보류된 제품 결정 요약

`SESSION_CONTEXT.md`에는 Dearly 참고 이유, 왜 기능을 줄였는지, 카드형을 뺀 이유, 도트 컬러 프리셋 논의, 초보자 UX 원칙, 서버리스 결정, PDF 요구사항, 첫 모바일 확인 후 Heart 배치를 수정하게 된 이유 등 원래 기획 대화의 핵심 흐름을 담았습니다.

## V1

- Grid / Heart layout
- 4 / 6 / 9 / 12 / 16 / 20 photo presets
- Grid portrait / landscape orientation swap
- Narrow / Normal / Wide gap presets
- White / Ivory / Black / Dot / Check frame presets
- Dot color combinations: Red / Black / Pink / Ivory
- Check color combinations: Red / Black / Beige
- Shadow on / off
- Photo reposition, zoom, replace, delete, reorder
- High-resolution PNG export
- Print-ready A5 / A4 / A3 PDF export (300 DPI target)
- No login, database, API server, or photo upload server

## Important current product decision

Heart는 일반 그리드를 하트 모양으로 잘라내는 방식이 아닙니다.

사진이 대각선으로 크게 잘리던 초기 버전 피드백을 반영해, **사진 타일 자체를 최대한 온전하게 유지하면서 사진들을 하트 실루엣으로 배치하는 방식**을 현재 기준으로 사용합니다.

또한 사용자에게 임의의 행/열 숫자를 직접 입력하게 하지 않습니다. Grid는 사진 개수에 맞게 자동 배치하고 필요할 때 가로/세로만 전환하며, Heart는 사진 개수별 완성형 배치를 제품이 제공합니다.

## Product principle

사진을 고르고 취향만 선택하면 30초 안에 첫 결과물이 나오도록 설계합니다. 픽셀 단위 설정이나 복잡한 디자인 도구는 V1에서 제공하지 않습니다.

> 초보자는 디자인하지 않고 선택만 한다. 결과물은 기본값부터 예뻐야 한다.

## Privacy

사용자 사진은 서버로 업로드되지 않습니다. `File API`, Object URL, Canvas를 이용해 현재 브라우저 안에서만 편집하고 PNG/PDF를 생성합니다.

## Stack

- React
- TypeScript
- Vite
- jsPDF
- Static deployment on Vercel
- GitHub Actions build verification

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## V1.2

- Shared preview / adjustment / export renderer; square-tile Heart compositions.
- Cover / show whole photo, bounded drag, reset, undo / redo.
- A5 / A4 / A3 / A2, portrait / landscape, PNG and PDF.
- Color / photos-only grayscale / entire poster grayscale.
- Effective source DPI guidance, explicit 150-DPI fallback, partial-upload recovery and empty-slot confirmation.
- `npm ci`, `npm test`, `npm run build`.

[Implementation plan](docs/IMPLEMENTATION_PLAN.md) · [Validation record](docs/VALIDATION.md).

## V1.3

- 사진관리 보관함과 배치 칸 분리: 반복 다중 추가, 미배치 필터, 빈칸 자동 채우기.
- 보관함→칸 배치, 칸끼리 교환: 데스크톱 끌어 놓기와 터치/클릭 선택 방식.
- 사진 수를 줄이거나 칸에서 빼도 원본은 보관함에 유지.
- Heart 하단으로 갈수록 작은 정사각형 타일, 제목 어절 단위 줄바꿈.
- 5×7 / 8×10 인치와 80~600mm 맞춤 종이, 액자 가림 여유, 여백 프리셋.
- 실제 액자 미리보기와 인쇄할 종이 구분. 액자 외형은 PNG/PDF에 포함하지 않음.

[수정 계획](docs/V1_3_PLAN.md) · [검수 기록](docs/VALIDATION.md)

## V1.4 — 용지를 채우는 그리드 (2026-09-07)

그리드의 정사각형 고정을 해제하고 용지 내부 사각 영역을 직사각형 사진 칸으로 채운다. 네 방향 바깥 여백과 가로·세로 사진 간격은 동일하다. 기본은 좁은 간격 + 최소 액자 안전 여백이며, 편집 화면에서 ‘꽉 채우기 / 여백 있게’를 선택할 수 있다. 기본 세로 용지에 맞춰 6/12/20장은 각각 2열×3행 / 3열×4행 / 4열×5행으로 시작한다. 행열 전환 기능은 유지한다. 하트는 기존 실루엣을 유지한다. 미리보기·사진 조정·PNG/PDF는 공통 칸 계산을 사용한다. 칸 채우기는 원본 일부를 자를 수 있으며 사진 전체 보기 옵션을 유지한다.

## V1.5 — 포토테이블 기본값과 열린 편집 화면

흰 배경, 인쇄 그림자 OFF, 좁은 간격, 최소 액자 안전 여백을 기본으로 설정하고 추천 스타일 적용 버튼을 추가했다. 그리드 1/2장을 지원하고 A5 1~4장, A4 4~6장, A3 6~12장을 디자인 가이드로 안내한다. 하트는 4장 이상만 지원하며 1/2장 그리드에서 전환 시 4칸으로 확장하고 사진은 유지한다.

사진 보관함은 파일명을 표시하지 않고 큰 썸네일의 여러 열 목록, 배치 칸 배지, 편집/삭제 버튼으로 구성한다. 접근성 이름은 사진 번호를 사용한다. 사진 조정은 모달을 제거하고 전체 미리보기 아래 인라인 영역으로 옮겼다. 편집 중 전체 포스터는 작게 고정되어 스크롤하며 변경을 볼 수 있다. 페이지 스크롤 및 다른 칸 선택을 차단하지 않는다. 저장 설정만 모달이다. 실제 액자 외형/그림자는 미리보기 전용이다.

## V1.6 — 수동 배치와 간격 슬라이더

최신 사용자 요청으로 이전 자동 배치 및 간격 3단계 제한을 변경한다. 최초/추가 업로드는 보관함에만 저장하고 슬롯을 자동으로 채우지 않는다. 자동 채우기 버튼도 제거한다. 직접 드래그 또는 사진/칸 선택을 통해서만 배치한다. 보관함은 전체/사용 중/미사용 필터와 상태 배지로 구분한다. 배치된 칸 우측 상단 ×는 슬롯만 비우며 원본을 유지한다. 미리보기 컨트롤은 출력에 포함하지 않는다.

간격은 용지 짧은 변의 0~2.6% 범위 슬라이더(27단계)로 변경하고 선택한 용지의 mm 값을 표시한다. 기존 프리셋은 추천 스타일 내부 값으로 호환 유지한다.
