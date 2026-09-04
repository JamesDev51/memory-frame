# Memory Frame

서버 없이 브라우저에서만 동작하는 초간단 포토 프레임 메이커입니다.

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

## Product principle

사진을 고르고 취향만 선택하면 30초 안에 첫 결과물이 나오도록 설계합니다. 픽셀 단위 설정이나 복잡한 디자인 도구는 V1에서 제공하지 않습니다.

## Privacy

사용자 사진은 서버로 업로드되지 않습니다. `File API`, Object URL, Canvas를 이용해 현재 브라우저 안에서만 편집하고 PNG/PDF를 생성합니다.

## Stack

- React
- TypeScript
- Vite
- jsPDF
- Static deployment on Vercel

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
