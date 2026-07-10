# Design — fe-mock-interview

FE-only, on-canon (skill `starci-fe-cannon-apply`). Nối REST BE đã deploy. Không streaming (BE one-shot).

## 1. REST layer (`src/modules/api/rest/mockinterview/`)

`types.ts` — mirror DTO BE: `SeedTopicView{id,kind,title,prompt}`, `SessionDrawView{sessionId,level,mode,
deadlineAt,seedTopics[]}`, `SessionView{...,status,questionIndex,turns}`, `ScorecardView{attemptId,
overallScore,verdict,questionReviews[{questionIndex,score,feedback}],attributeScores?,strengths?,gaps?,
followUpQuestion?}`, `AttemptListView{totalCount,items[AttemptSummaryView]}`, `StatsView{insufficientData,
attemptCount,avgScore,verdictCounts{PASS,BORDERLINE,FAIL},trend[]}`, request types.

`mockinterview.ts` — arrow async qua `restRequest<T>`:
| fn | method url |
|---|---|
| drawSession(req) | POST `/ai/mock-interview/sessions` |
| getSession(id) | GET `/ai/mock-interview/sessions/{id}` (authenticated:true) |
| saveAnswer(id,req) | POST `/ai/mock-interview/sessions/{id}/answers` |
| gradeSession(id) | POST `/ai/mock-interview/sessions/{id}/grade` |
| syncTurns(id,req) | POST `/ai/mock-interview/sessions/{id}/turns` |
| getInProgress(courseRef) | GET `/ai/mock-interview/in-progress` (params, authenticated:true) |
| getAttempts(courseRef,limit,offset) | GET `/ai/mock-interview/attempts` (params, authenticated:true) |
| getAttemptBySession(sessionId) | GET `/ai/mock-interview/attempts/by-session/{id}` (authenticated:true) |
| getStats(courseRef) | GET `/ai/mock-interview/stats` (params, authenticated:true) |

`index.ts` — `export * from "./types"` + `export * from "./mockinterview"`. Import qua barrel
`@/modules/api/rest/mockinterview`.

## 2. SWR hooks (reads)

`useGetMockInterviewInProgressSwr(courseRef)`, `useGetMockInterviewAttemptsSwr(courseRef,limit,offset)`,
`useGetMockInterviewStatsSwr(courseRef)` — `"use client"`, `useSWR<T,Error>(["KEY",...args], () => fn(...))`,
`return swr`. Writes gọi imperative (drawSession/saveAnswer/gradeSession/syncTurns) trong orchestrator để
điều khiển flow tuần tự + `mutate` lại history/stats sau grade.

## 3. Route + shell

`learn/mock-interview/page.tsx` = `"use client"` mount `<MockInterview/>` (mirror mind-map). Trong
`learn/layout.tsx` thêm nhánh `segments[0]==='mock-interview'` → rail-less full-width (1 flow). Route helper
`learn().mockInterview()` trong `resources/path/index.ts`.

## 4. Feature components (`components/features/learn/MockInterview/`)

- `index.tsx` — orchestrator `"use client"`: đọc `courseId` qua `useParams`; state máy `phase:
  'greenroom'|'session'|'scorecard'`; tab `practice|history|stats` (SegmentedControl). Khi mount, gọi
  in-progress hook → nếu có phiên dở < 24h → prompt resume (vào 'session' với turns cũ). AsyncContent bọc.
- `GreenRoom.tsx` — SegmentedControl tier (Sơ/Trung/Cao) + số câu (3/5/10) + nút "Bắt đầu" (plain button vì
  onPress flaky) → `drawSession` → set session + phase='session'. Loading/deadline hiển thị.
- `SessionRunner.tsx` — hiện câu theo `questionIndex` (ProgressMeter "Câu i/N"), ô trả lời `TextField+TextArea`,
  Trước/Sau, "Nộp & chấm" khi câu cuối → `saveAnswer` mỗi câu (debounce/onBlur) + `syncTurns` định kỳ →
  `gradeSession` → phase='scorecard'. Deadline countdown (auto-grade khi hết giờ, best-effort).
- `Scorecard.tsx` — `Score` (overallScore/100) + `Chip` verdict (success/warning/danger) + per-câu review
  (điểm + feedback, dấu severity). Ẩn attributeScores/strengths/gaps/followUp khi null. Nút "Luyện lại" →
  greenroom; refetch history+stats.
- `HistoryPanel.tsx` — `useGetMockInterviewAttemptsSwr` → list rows (điểm + verdict Chip + thời gian) +
  AsyncContent + skeleton; bấm 1 attempt → xem lại scorecard (`getAttemptBySession`).
- `StatsPanel.tsx` — `useGetMockInterviewStatsSwr` → `SegmentBar` pass/borderline/fail counts + avgScore
  (`Score`) + trend (danh sách/mini). insufficientData → empty state.

## 5. Ràng buộc UI (house rules)

- Control tương tác chính (bắt đầu, chọn tier/câu, nộp) = **plain `<button onClick>`** + focus-visible ring
  (onPress HeroUI flaky headless). Button phụ/nav dùng HeroUI `Button variant`.
- Input đứng riêng = HeroUI `TextField+Input/TextArea` (KHÔNG flat trừ composer-in-box).
- Verdict → Chip color: PASS=success, BORDERLINE=warning, FAIL=danger.
- AsyncContent cho mọi vùng data; skeleton mirror layout.
- Spacing scale nhà (0·2·3·4·6); block-owns-padding; dùng block canon (SegmentBar/ProgressMeter/Score/
  StatRibbon/SectionCard), KHÔNG hand-roll primitive.
- i18n vi+en parity; sửa JSON bằng Edit/Write (tránh mojibake PS 5.1).

## 6. Gate & phân biệt

- Enrolled-gate do BE (draw → 403 `MOCK_INTERVIEW_FORBIDDEN` nếu chưa enroll) → FE hiện empty/CTA "Đăng ký
  khóa" ([[premium-unlock-is-enroll-not-vip]]), KHÔNG tự gate.
- `ftes-ai-service` down → BE 503 `AI_CONTENT_DOWN` → FE hiện lỗi tạm + retry.
- Đây là MOCK_INTERVIEW (`ai.mockinterview`), KHÔNG phải INTERVIEW_COURSE (`ai.interview`) — đừng trộn.

## 7. Verify

`tsc --noEmit` sạch; `npm run build` (webpack) xanh; `npm run dev` (turbopack) nối apitest → login
student.test → vào course đã enroll → draw→answer→grade→history→stats bằng tay/preview.
