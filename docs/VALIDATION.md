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

### V1.3 deployment result

- Source commit: `35b994bf2f8f91b530705b36acf43429454d383f`. GitHub Actions `build`: success. Vercel commit status: success / Deployment has completed.
- Production browser navigation timed out, and one browser-runtime recovery also timed out. Therefore no claim is made that V1.3 desktop drag, mobile interaction, visual Heart appearance or custom-size downloaded files were verified in the live browser. These remain manual acceptance checks.
- V1.2 production PDF/PNG results above are historical evidence, not V1.3 end-to-end results.
- Production alias HTTP 200; HTML references `index-BKfiJD1q.js` and `index-C3Czh4o-.css`, matching the local V1.3 production build.

## V1.4 검수

`npm test` 14개 통과. 기존 1,512개 비겹침/경계 검사와 별도로 그리드 1,512개 조합(개수·용지·방향·여백·간격·행열 전환)에서 네 방향 균일 여백, 가로/세로 동일 간격, 미리보기/출력 좌표 비례를 검사했다. 직사각형 칸에서 cover/contain 보존 검사도 통과했다. `npm run build` 통과. 실물 인쇄 및 모바일 조작 검수는 별도 미완료이며 이번 기록은 계산·빌드 검수다.

## V1.5 검수

- 자동 검사 14개 및 production build 통과.
- 1/2장 그리드를 포함한 1,764개 경계·겹침 조합, 그리드 2,016개 여백/간격/미리보기-출력 비례 조합 검사.
- 코드 검수: 사진 조정에서 modal/backdrop/스크롤 잠금 제거, 저장 모달만 focus trap 유지. 사진 변경 시 조정 컴포넌트 상태 초기화.
- 실제 브라우저 조작/모바일 시각 검수와 실물 인쇄는 미완료. 계산 및 빌드 통과를 실제 조작 검수로 표현하지 않는다.

## V1.6 검수

14개 자동 검사 및 빌드 통과. 칸 경계·겹침 검사는 간격 슬라이더 전체 27값과 기존 3프리셋을 검사하도록 확장했다. 업로드는 setPlacements(empty/current)로 기존 슬롯을 보존하며 자동 채우기 UI를 제거했다. ×는 캔버스와 별도 버튼으로 슬롯만 비우고 보관함을 변경하지 않는다. 실제 모바일/브라우저 조작 검수는 미완료.

## V1.7 검수

보관함을 미리보기의 형제 열로 이동. CSS 반응형 분기(900/1150px), 내부 스크롤, 용지 비율 유지 코드 확인. 빌드 검증 수행. 실제 노트북 화면/드래그 시각 검수는 미완료이며 배포 파일 반영과 구분한다.

## V1.8 검수

빌드 및 15개 자동 검사. 간격0~80 전 범위와 기존 프리셋에서 경계/겹침을 검사한다. 그림자 범위 및 작은 하트 칸 보존 검사를 추가했다. AI 배경 2장은 생성 결과를 직접 확인하고 WebP 전송 최적화(각 약68KB/35KB) 후 포함했다. 실제 브라우저 합성 화면, 모바일 터치, 실물 인쇄는 미검증.

## V1.9 검수

- 자동 검사16개 및 빌드. 폴라로이드 카드의 슬롯 포함/정사각 사진창/넓은 하단 여백 검사 추가.
- 실제 renderToCanvas 소스를 Node native Canvas로 실행: 600×849 빈 카드 미리보기에서 그림자0→100 변경 시 어두워지는 픽셀102,588개. 빈칸 출력은 균일 배경으로 남음. 4장 폴라로이드 결과 PNG를 열어 시각 확인. 이 검사는 브라우저 실행이 아닌 렌더러 검사다.
- Dearly 공개 페이지 텍스트 확인: 폴라로이드 액자, 보관함/칸 편집, A3/A5, 인쇄 후 그림자 조정 안내. 브라우저 화면 접속은 timeout. 정확한 간격/테두리/그림자 수치는 확인하지 않았고 복제하지 않음.
- 실제 사이트/모바일 브라우저 UI 검수는 미완료.
