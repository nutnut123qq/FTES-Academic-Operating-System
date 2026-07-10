# Tasks — fe-mock-interview

> On-canon (skill `starci-fe-cannon-apply`). Verify `tsc --noEmit` + `npm run build` (webpack) trước commit.

## 1. REST layer
- [x] 1.1 `src/modules/api/rest/mockinterview/types.ts` — DTO mirror BE (Seed/Session/Scorecard/AttemptList/Stats + request types).
- [x] 1.2 `mockinterview.ts` — 9 hàm arrow async qua `restRequest<T>` (GET ghi `authenticated:true`; url `/ai/mock-interview/...`).
- [x] 1.3 `index.ts` barrel (`export * from ./types` + `./mockinterview`).

## 2. SWR query hooks
- [x] 2.1 `useGetMockInterviewInProgressSwr(courseRef)` (queries/).
- [x] 2.2 `useGetMockInterviewAttemptsSwr(courseRef,limit,offset)`.
- [x] 2.3 `useGetMockInterviewStatsSwr(courseRef)`.

## 3. Route + shell + path helper
- [x] 3.1 `learn/mock-interview/page.tsx` (thin, mount `<MockInterview/>`).
- [x] 3.2 `learn/layout.tsx` — nhánh `mock-interview` → rail-less full-width.
- [x] 3.3 `resources/path/index.ts` — `learn().mockInterview()`.

## 4. Feature components (`components/features/learn/MockInterview/`)
- [x] 4.1 `index.tsx` orchestrator — courseId + phase machine + tab practice/history/stats + resume-prompt (in-progress) + AsyncContent.
- [x] 4.2 `GreenRoom.tsx` — SegmentedControl tier + số câu + "Bắt đầu" (plain button) → drawSession.
- [x] 4.3 `SessionRunner.tsx` — ProgressMeter câu i/N + TextArea trả lời + saveAnswer + syncTurns + "Nộp & chấm" → gradeSession; deadline countdown.
- [x] 4.4 `Scorecard.tsx` — Score + Chip verdict + per-câu review; ẩn field null; "Luyện lại".
- [x] 4.5 `HistoryPanel.tsx` — attempts list + AsyncContent + skeleton; xem lại attempt (by-session).
- [x] 4.6 `StatsPanel.tsx` — SegmentBar verdict counts + avgScore + trend; insufficientData empty.

## 5. Entry point + i18n
- [x] 5.1 Thêm card/link "Luyện phỏng vấn" ở `learn/page.tsx` (learn không có nav sống) → route mock-interview.
- [x] 5.2 i18n `learn.mockInterview.*` (vi.json + en.json parity): title, tiers, counts, start, questionN, answerPlaceholder, submit, verdicts, score, retry, historyTitle, statsTitle, empty, forbidden CTA...

## 6. Verify
- [x] 6.1 `tsc --noEmit` sạch.
- [x] 6.2 `npm run build` (webpack) xanh.
- [x] 6.3 `npm run dev` nối apitest → E2E tay (student.test, course đã enroll): draw→answer→grade→history→stats.
