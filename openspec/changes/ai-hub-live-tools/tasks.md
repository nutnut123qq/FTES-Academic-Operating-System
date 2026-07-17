# Tasks — ai-hub-live-tools

## 1. Tính năng A — Envelope 1002 + poll dùng chung
- [ ] 1.1 `client.ts`: success codes {200, 1002} (comment lý do Accepted/JobRef)
- [ ] 1.2 Hook `useAiJobPolling` (SWR refreshInterval động, stop ở COMPLETED/FAILED, isStale 90s)
- [ ] 1.3 Unit test: 1002 trả data, code khác throw như cũ; polling dừng đúng, stale flag
- [ ] 1.4 **Vòng chất lượng**: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2

## 2. Tính năng B — Tile wiring
- [ ] 2.1 `useQueryAiToolsSwr`: thêm `href` per tool; XÓA mentor khỏi catalog
- [ ] 2.2 `AiHub`: CTA `as={Link}`; tutor → logic học-tiếp (1 khóa thẳng lesson / nhiều → modal / 0 → CTA catalog) dùng query "khóa của tôi" sẵn có
- [ ] 2.3 Unit test: mọi tile có action, mentor vắng, 3 nhánh tutor
- [ ] 2.4 e2e tay: bấm từng tile đi đúng nơi
- [ ] 2.5 **Vòng chất lượng**: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2

## 3. Tính năng C — 4 trang job tools
- [ ] 3.1 Khung `AiToolPage` + route `/ai/tools/{summary,flashcards,quiz,debug}` (xác nhận route group `/ai` hiện có)
- [ ] 3.2 Summary/Flashcards/Quiz: form (text | lesson picker, tham số) → submit job → poll → render per-type (tldr/cards lật/quiz làm tại chỗ); hiện model + quota còn lại
- [ ] 3.3 Debug: code + language + mô tả → `submitCodeReviewJob` → render markdown
- [ ] 3.4 Error states: FAILED, quota 429, stale retry; types job result
- [ ] 3.5 Unit test: submit body đúng, render 4 loại result từ fixtures, error states
- [ ] 3.6 e2e tay trên dev: chạy đủ 4 tool với BE apitest
- [ ] 3.7 **Vòng chất lượng**: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2

## 4. Tính năng D — CV builder + review UI
- [ ] 4.1 REST module `career` (`getMyCv/putMyCv`) + types khớp shape BE
- [ ] 4.2 Form builder Harvard (repeaters) + load/save; validate client (bắt buộc header.fullName, email)
- [ ] 4.3 Xuất PDF `@react-pdf/renderer` template Harvard (thêm dependency)
- [ ] 4.4 Tab upload (pdf/docx ≤10MB, presigned flow sẵn có) + submit `{storageKey}`; builder submit `{cvProfileId}`; kết quả review render structured
- [ ] 4.5 Unit test: shape body PUT, validate file, render kết quả, PDF render không crash (smoke)
- [ ] 4.6 e2e tay: build → save → export PDF → review end-to-end
- [ ] 4.7 **Vòng chất lượng**: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2

## 5. Tính năng E — Planner UI
- [ ] 5.1 REST: `createStudyPlan/getStudyPlans/getStudyPlan/patchStudyPlanProgress/archiveStudyPlan` + `StudyPlanView`
- [ ] 5.2 Form tạo (goal/deadline/hours/level/topics/model) timeout dài; empty list → thẳng form
- [ ] 5.3 Timeline tuần + checklist optimistic check-off (rollback khi lỗi) + progress bar percentDone; archive confirm
- [ ] 5.4 Unit test: taskKey build đúng `w{week}:{idx}`, optimistic rollback, empty state
- [ ] 5.5 e2e tay: thấy plan seed demo, check-off, tạo plan mới
- [ ] 5.6 **Vòng chất lượng**: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2

## 6. Verify
- [ ] 6.1 `npm run build` (webpack) xanh + `tsc --noEmit` sạch; i18n vi/en đủ khoá; `openspec validate ai-hub-live-tools --strict` PASS
