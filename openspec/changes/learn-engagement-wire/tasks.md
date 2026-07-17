# Tasks — learn-engagement-wire

## 1. REST + SWR layer
- [ ] 1.1 `modules/api/rest/course`: `LessonReactionSummaryView` + `getLessonReactions`/`putLessonReaction`/`deleteLessonReaction`; `CourseAccessStateView` + `getMyCourseAccess`; `EnrollmentView.isPurchased`
- [ ] 1.2 SWR: `useGetLessonReactionsSwr`, `usePutLessonReactionSwr`, `useDeleteLessonReactionSwr`, `useGetMyCourseAccessSwr` + barrels

## 2. Lesson reaction wire (lesson-reaction-wire)
- [ ] 2.1 `LessonReactionFooter` → REST + optimistic toggle + rollback; disable like khi PREVIEW (tooltip enroll); xóa `useLessonReactionMock.ts`
- [ ] 2.2 i18n `learn.reactions.likeGated` (vi+en)
- [ ] 2.3 Quality loop tính năng reaction: unit test (map summary, optimistic rollback) + e2e test (seed demo: mở lesson thấy 42 view → like → unlike) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 3. Watch-position reporter (watch-position-report)
- [ ] 3.1 Hook `useWatchPositionReporter` (interval 30s khi playing, flush pause/seek/unmount/visibilitychange, throttle 5s) — KHÔNG đụng flow complete 50%
- [ ] 3.2 Gắn vào player VIDEO trong `LessonReader`
- [ ] 3.3 Quality loop tính năng watch-position: unit test (fake timer: interval/throttle/flush) + e2e test (course có video thật trên apitest — seed demo không có video READY, ghi chú) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 4. CourseQa roll-up (course-qa-rollup)
- [ ] 4.1 `useQueryCourseQuestionsSwr` → adapter thật (cây lesson từ useQueryLearnCourseSwr, fan-out getLessonComments chunk 5, map CommentView → CourseQuestion + href lesson); xóa `mock.ts`
- [ ] 4.2 Composer chọn lesson đích → `usePostLessonCommentSwr` → revalidate roll-up; i18n `learn.qa.*`
- [ ] 4.3 Quality loop tính năng Q&A: unit test (mapper comment→question, chunk fan-out) + e2e test (post comment ở lesson → thấy trong Q&A → link nhảy đúng bài) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 5. isPurchased thật (course-purchase-flag-fe)
- [ ] 5.1 `useQueryCourseDetailSwr`: đọc `isPurchased` từ enrollment; fallback `getMyCourseAccess` khi có token mà không khớp enrollment; xóa comment hardcode dòng 312-314
- [ ] 5.2 Quality loop tính năng isPurchased: unit test (3 nhánh: purchased/enroll-free/anonymous) + e2e test (seed demo: account có purchase mở detail course package) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 6. Verify chung
- [ ] 6.1 `npm run build` xanh + `tsc --noEmit` sạch; `openspec validate learn-engagement-wire --strict` pass
