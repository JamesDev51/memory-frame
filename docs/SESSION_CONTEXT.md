# Memory Frame — Session Context / Handoff

> Purpose: make it possible to continue this project in a new ChatGPT / Codex session without losing the product reasoning from the original planning conversation.

This file intentionally records **why** the product was shaped this way, not only what the code currently does.

---

## 1. Origin of the idea

The project started from reviewing `https://dearly.kr/frame`.

The user wanted to build a similar service, but:

- provide it for free,
- offer a little more flexibility than the reference service,
- keep it extremely easy for non-designers,
- run it with frontend only and no server,
- support printable PDF output.

The reference service was understood as a simple photo-frame generator: users put multiple photos into a composed frame, adjust photos, and save / print the result.

The important conclusion from the discussion was that the product opportunity is **not** “build a more advanced editor.”

It is:

> make the attractive output people want easier to get.

The user explicitly questioned why people comment heavily on content about tools like this when the actual software is not technically hard to build.

The answer that shaped the product was:

> users are reacting to the shortcut to a desirable result, not to engineering complexity.

A user does not want “a photo editor.” The user wants:

> “the pretty wedding / memory board I saw online, but without figuring out how to design it myself.”

---

## 2. Visual references discussed

The user shared multiple visual references representing possible long-term directions, including:

- large black-and-white photo collage with a calendar block,
- playing-card-like photo layout,
- scrapbook-style birthday board with stickers / doodles,
- vintage photo-booth strip in a frame,
- wedding welcome boards,
- childhood-photo wedding welcome board,
- invitation / photo / printed-material memory board,
- guest-signature style wedding board.

These references broadened the initial idea from “simple photo frame generator” toward a possible future category of:

> **memory board / wedding display maker**

However, after discussing complexity, the decision was **not** to build all of these in V1.

The product was intentionally narrowed.

---

## 3. Key simplification conversation

There was an important product-design discussion about feature creep.

Initial brainstorming included:

- Grid
- Heart
- card-style frames
- photo booth
- text
- stickers
- backgrounds
- many templates
- free placement
- wedding-specific boards

The user repeatedly emphasized:

> “최대한 쉬운거로만 가자”

and:

> too many options will make it complicated for true beginners.

The resulting product philosophy became:

> **Give good presets, not lots of controls.**

The final V1 was deliberately reduced to the smallest set of controls that materially change the result.

---

## 4. Card layout decision

A “card” layout was initially mentioned because one visual reference used playing-card shapes.

The user asked what “card type” meant and then suggested removing it.

Final decision:

> **Card layout is not part of V1.**

If card aesthetics are ever added later, they should be a specialized template / frame style, not a core layout mode.

---

## 5. Final core layout decision

The V1 should have only two primary layouts:

1. Grid
2. Heart

The goal is to keep the initial choice obvious.

Photo-booth-like results can later be represented through narrow Grid presets rather than creating another mental model.

---

## 6. Photo count and row/column discussion

The user originally considered:

- adjusting horizontal / vertical row and column counts,
- changing spacing between photos.

The final conversation refined this further.

### Photo count

The user chooses from common photo-count presets:

- 4
- 6
- 9
- 12
- 16
- 20

### Grid rows / columns

The service automatically maps photo count to a sensible grid.

Example:

- 12 photos → 4 × 3

For non-square grids, a simple “가로 · 세로 바꾸기” action is enough.

### Do not expose arbitrary row/column inputs

The user should not need to think:

> rows = 3, columns = 4

The user should think:

> “I have 12 photos.”

This was explicitly chosen to preserve beginner friendliness.

### Heart rows / columns

No row / column controls for Heart.

Heart is a product-owned composition.

---

## 7. Gap decision

The user asked whether gap adjustment should remain.

Decision:

> **Yes. Keep gap adjustment.**

Reason:

Gap has a large visual effect but requires very little mental effort.

Expose only:

- 좁게
- 기본
- 넓게

Do not expose pixel values or a continuous slider in V1.

---

## 8. Frame discussion

The user specifically confirmed that frame customization should be included.

The word “frame” is meant to be a user-facing umbrella concept.

Do not make beginners separately understand:

- border,
- mat,
- pattern layer,
- outer background.

Instead show visual frame presets.

Core V1 frame directions:

- White
- Ivory
- Black
- Dot
- Check

---

## 9. Dot pattern discussion

The user specifically asked whether patterns such as:

- red background with white dots,
- black background with white dots

were possible.

This became an important visual customization feature.

Then the user asked whether dot colors should be customizable.

Decision:

> allow color choice, but as curated combinations rather than a free color picker.

V1 dot variants:

- Red × White
- Black × White
- Pink × White
- Ivory × Black

Do not expose:

- dot size,
- dot spacing,
- arbitrary foreground/background color picker.

This is a representative example of the broader product principle:

> **more choice without more complexity.**

---

## 10. Shadow discussion

The user asked to add “그림자 정도?”

Decision:

> Include shadow because it gives a noticeable visual finish for little UX cost.

But expose only:

- ON
- OFF

No advanced shadow controls.

---

## 11. Beginner-first UX decision

The strongest recurring user requirement was that the app must be usable by true beginners.

The conversation explicitly rejected turning the service into a general design editor.

Desired interaction:

```text
choose layout
→ choose photo count
→ choose photos
→ immediately see something attractive
→ maybe change frame / gap / shadow
→ save
```

The product should feel more like:

> “choose your taste”

than:

> “design something.”

Advanced options can exist behind progressive disclosure, but should not block the first result.

---

## 12. Frontend-only architecture decision

The user explicitly required:

> frontend only; no server.

This is a hard architecture constraint for V1.

No:

- API server,
- DB,
- image storage backend,
- login,
- user account,
- server-generated export.

Photos are processed locally in the browser.

This also became user-facing trust copy:

> “사진은 서버에 업로드되지 않아요.”

---

## 13. PDF requirement

The user explicitly required PDF saving.

The product must support browser-generated printable PDFs.

V1 sizes:

- A5
- A4
- A3

The design should be rendered at high resolution using source photos rather than simply screenshotting the visible preview.

Target is approximately 300 DPI.

PNG export should also be high resolution.

---

## 14. Initial V1 implementation

The repository was created as:

`JamesDev51/memory-frame`

Initial stack:

- React
- TypeScript
- Vite
- jsPDF
- Vercel

Implemented V1 capabilities included:

- Grid / Heart
- photo count presets
- photo selection
- auto placement
- gap presets
- frame presets
- dot / check variants
- shadow toggle
- photo position / zoom
- replace / delete / reorder
- PNG export
- A5/A4/A3 PDF export
- responsive mobile-first UI
- GitHub Actions build verification

---

## 15. Important Heart feedback from real mobile check

After the first production version was viewed on a phone, the user shared a screenshot.

The overall UI design was considered generally good.

The main visible problem was the Heart layout.

### Problem in first Heart version

The implementation used a normal rectangular grid with a heart-shaped clip mask.

This produced:

- diagonal cuts,
- partial photo tiles,
- heavily clipped edge images,
- visually awkward faces.

The user specifically said the heart shape felt disappointing and that photos were being cut too much.

### Decision

The Heart layout should not be a clipping mask.

It should instead be:

> **a set of intact rectangular photo tiles arranged into a heart silhouette.**

This became the next implementation priority before adding more advanced features.

The repository was subsequently changed so Heart uses photo-count-specific positional presets and the render/export path was updated to follow the same composition semantics.

Future sessions should continue tuning the Heart visually if needed.

---

## 16. Heart visual tuning priorities

If the current Heart still needs polish, tune in this order:

1. overall recognizable heart silhouette,
2. minimal photo clipping,
3. readable faces,
4. natural two top lobes,
5. clean bottom taper / heart point,
6. balanced width vs height,
7. consistent behavior for 4/6/9/12/16/20 photos,
8. gap presets should still feel meaningful,
9. preview / PNG / PDF must match.

Do not “fix” Heart by simply returning to one global clip-path.

---

## 17. Current thinking on advanced features

The user asked whether more advanced features had been implemented.

Current conclusion:

> **Do not add advanced features just to make the service look more capable.**

The right near-term path is to improve the quality of the small core feature set.

Especially:

- make Heart excellent,
- keep Grid reliable,
- make frame choices attractive,
- make export trustworthy,
- keep mobile usage obvious.

---

## 18. Long-term ideas discussed but not V1 requirements

The conversation explored many future possibilities:

- wedding welcome boards,
- childhood-photo wedding boards,
- guest-signature boards,
- scrapbook boards,
- photo booth strips,
- calendar collage boards,
- invitation / memorabilia compositions,
- wedding photo-table designs,
- simple template text such as names / date.

These are important as a future direction but should **not** be treated as already-approved V1 scope.

A possible long-term positioning is:

> wedding / couple / anniversary template-based memory design maker

But only after the simple frame maker proves useful.

---

## 19. Distribution / content thinking

The broader project context includes wedding / couple social content.

One attractive distribution angle discussed was:

> “I wanted this for my own wedding / photo table, so I made a free tool. Just put your photos in.”

This makes the tool feel like a useful resource rather than an advertisement.

A powerful future content/product loop is:

```text
See attractive reference on Pinterest / Instagram
→ turn it into a simple curated template
→ publish a short-form video showing the result
→ users use the free template
```

This reinforces why the app should remain template/preset-driven rather than becoming a general-purpose editor.

---

## 20. Product language to preserve

Useful framing from the conversation:

- “사진만 넣으면 바로 완성”
- “초보자는 선택만 하고, 결과물은 이미 예쁘게”
- “디자인한다보다 취향만 고른다”
- “기능이 많다보다 원하는 결과물을 쉽게 얻는다”
- “Canva를 다시 만드는 게 아니다”
- “사진 선택 후 30초 안에 첫 완성본”

These ideas should guide copy, UX, and future feature decisions.

---

## 21. What a new session should read first

Recommended reading order:

1. `docs/SESSION_CONTEXT.md` — why the product looks like this
2. `docs/PRD.md` — canonical requirements
3. `docs/PRODUCT_DECISIONS.md` — concise accepted/rejected decisions
4. current source code
5. latest GitHub Actions status
6. latest Vercel production deployment

Do not assume older ideas from brainstorming are still active requirements if they conflict with the canonical PRD or decision log.

---

## 22. Instruction to future implementation sessions

Before adding a new feature, preserve these user preferences:

- beginner-first,
- minimal controls,
- curated defaults,
- frontend only,
- local photo processing,
- free export,
- high-quality PDF,
- visual quality over feature quantity.

When ambiguous, prefer **simpler UI and better presets** over additional controls.
