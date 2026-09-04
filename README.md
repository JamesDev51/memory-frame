# Memory Frame

서버 없이 브라우저에서만 동작하는 초간단 포토 프레임 메이커입니다.

## V1 direction

- Grid / Heart layout
- Photo count presets
- Narrow / Normal / Wide gap presets
- White / Ivory / Black / Dot / Check frame presets
- Shadow on / off
- High-resolution PNG export
- Print-ready A5 / A4 / A3 PDF export
- No login, database, API server, or photo upload server

## Stack

- React
- TypeScript
- Vite
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

All user photos will be processed locally in the browser. The editor and export features will be implemented in the next phase.
