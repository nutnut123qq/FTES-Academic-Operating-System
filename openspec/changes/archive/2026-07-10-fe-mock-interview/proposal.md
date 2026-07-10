# fe-mock-interview — Màn luyện phỏng vấn (Mock Interview) trong Learn area

## Why

BE `ai-mock-interview` đã deploy apitest + E2E chạy thật (REST `/api/v1/ai/mock-interview/*`), nhưng FE
**chưa có màn nào** gọi nó → người dùng không luyện được qua app. Cần dựng UI on-canon để học viên: bốc
đề → trả lời text → xem scorecard → xem lịch sử + thống kê tiến bộ, resume phiên dở trong ngày.

## What Changes

- **REST client mới** `src/modules/api/rest/mockinterview/{mockinterview.ts, types.ts, index.ts}` — mirror
  `rest/ai/`: hàm arrow async qua `restRequest<T>`, url `/ai/mock-interview/...`, GET ghi `authenticated:true`.
  Hàm: `drawSession`, `getSession`, `saveAnswer`, `gradeSession`, `syncTurns`, `getInProgress`,
  `getAttempts`, `getAttemptBySession`, `getStats`.
- **SWR query hooks** (reads) dưới `src/hooks/swr/api/rest/queries/`: `useGetMockInterviewInProgressSwr`,
  `useGetMockInterviewAttemptsSwr`, `useGetMockInterviewStatsSwr`. Writes (draw/answer/grade/sync) gọi
  imperative trong feature component (flow tuần tự) — hoặc mutation hook nếu canon yêu cầu.
- **Route** `src/app/[locale]/courses/[courseId]/learn/mock-interview/page.tsx` (thin `use client` mount
  `<MockInterview/>`, mirror `mind-map/page.tsx`). Learn area rail-less full-width (1 flow phỏng vấn).
- **Feature** `src/components/features/learn/MockInterview/**` (orchestrator + sub-view): **Green room**
  (chọn tier Sơ/Trung/Cao + số câu 3/5/10 → draw), **Session** (hiện từng câu + ô trả lời text, nộp →
  grade; resume qua in-progress + syncTurns), **Scorecard** (overallScore + verdict + per-câu feedback;
  ẩn field null attributeScores/strengths/gaps/followUp — B-shoehorn BE), **History** (list attempts) +
  **Stats** (SegmentBar pass/borderline/fail + avgScore + trend). Dùng block canon: `AsyncContent`,
  `SegmentedControl`, `SegmentBar`, `ProgressMeter`, `Score`, HeroUI `Button/Chip/TextField/TextArea`.
- **Entry point**: thêm link/card "Luyện phỏng vấn" ở trang learn landing (`learn/page.tsx`) vì learn
  KHÔNG có sidebar nav sống — route mới sẽ mồ côi nếu không cắm entry.
- **Route helper** `mockInterview()` trong `src/resources/path/index.ts` (bên trong `learn()`).
- **i18n** namespace `learn.mockInterview.*` (vi + en, parity bắt buộc). Verdict/score tái dùng khái niệm
  có sẵn ở `flashcard.interview.*` khi hợp.

## Capabilities

### New Capabilities

- `fe-mock-interview`: UI luyện phỏng vấn trong Learn area — green room → session (text) → scorecard →
  history + stats; resume 24h; gọi REST BE `/api/v1/ai/mock-interview/*`; enrolled-gate do BE (403).

### Modified Capabilities

(none — feature FE mới, không đổi requirement spec sẵn có)

## Impact

- FE-only. Thêm REST domain `mockinterview`, 3 SWR query hook, 1 route + feature components, route helper,
  i18n keys (vi+en), 1 entry-point link ở learn landing. Không đụng BE (contract đã có, đã deploy).
- Không streaming/voice (BE one-shot). Scorecard rút gọn theo BE (ẩn field null).
- Verify: `tsc --noEmit` sạch + `npm run build` (webpack) xanh; chạy `npm run dev` nối apitest để E2E tay.
