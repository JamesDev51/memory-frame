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
