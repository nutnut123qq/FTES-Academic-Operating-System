# Tasks — learn-engagement-wire

## 1. REST + SWR layer
- [x] 1.1 `modules/api/rest/course`: `LessonReactionSummaryView` + `getLessonReactions`/`putLessonReaction`/`deleteLessonReaction`; `CourseAccessStateView` + `getMyCourseAccess`; `EnrollmentView.isPurchased`
  - reaction slice DONE (`LessonReactionSummaryView` + 3 fns + `LESSON_REACTION_LIKE`). isPurchased slice DONE: `EnrollmentView.isPurchased` (wire key is-prefixed) + `CourseAccessStateView` (`{courseId,enrolled,purchased,fullAccess}`, wire key `purchased`) + `getMyCourseAccess(courseRawId)` → `GET /courses/{id}/me/access` authenticated. Contract pinned từ BE `CourseDtos`/`CoursePurchaseFlagAuthIT` (me/access path var = course UUID = `course.rawId`, KHÔNG slug).
- [x] 1.2 SWR: `useGetLessonReactionsSwr`, `usePutLessonReactionSwr`, `useDeleteLessonReactionSwr`, `useGetMyCourseAccessSwr` + barrels
  - reaction hooks DONE (3 hooks + barrels queries/mutations). `useGetMyCourseAccessSwr` DONE: keyed trên `courseRawId` (UUID), `null` key gate (undefined → no fetch), `.catch(()=>null)` + `shouldRetryOnError:false` (401/404 degrade → null), export barrel queries.

## 2. Lesson reaction wire (lesson-reaction-wire)
- [x] 2.1 `LessonReactionFooter` → REST + optimistic toggle + rollback; disable like khi PREVIEW (tooltip enroll); xóa `useLessonReactionMock.ts`
- [x] 2.2 i18n `learn.reactions.likeGated` (vi+en)
- [ ] 2.3 Quality loop tính năng reaction: unit test (map summary, optimistic rollback) + e2e test (seed demo: mở lesson thấy 42 view → like → unlike) → đánh giá vòng 1 → fix → đánh giá vòng 2
  - NOTE: FE chưa có test runner (không jest/vitest, không `test` script) → unit/e2e chưa chạy được; xem BACKLOG-REVIEW. Verify hiện tại: `tsc --noEmit` sạch.

## 3. Watch-position reporter (watch-position-report)
- [x] 3.1 Hook `useWatchPositionReporter` (interval 30s khi playing, flush pause/seek/unmount/visibilitychange, throttle 5s) — KHÔNG đụng flow complete 50%
  - DONE: `LessonReader/hooks/useWatchPositionReporter.ts`. Signature thực tế `{lessonId, getSnapshot}` → trả `{onPlaying, onPaused, onSeeked}` (imperative, hợp player event-driven hơn `isPlaying` prop trong design). PUT `/courses/lessons/{id}/progress` qua `usePostReportLessonProgressSwr`; unmount/visibility flush dùng `reportLessonProgress` trực tiếp (beacon, tránh setState sau unmount). Throttle 5s; pause/hide/unmount bypass throttle (giữ resume point). KHÔNG gọi mark-complete — flow 50% giữ nguyên.
- [x] 3.2 Gắn vào player VIDEO trong `LessonReader`
  - DONE: `LessonHlsPlayer` (onPlay/onPause/onEnded/onSeeked trên `<video>` thật) + `LessonYouTubePlayer` (onStateChange PLAYING→onPlaying, else→onPaused; playerRef cho getSnapshot; nhận thêm prop `lessonId`).
- [ ] 3.3 Quality loop tính năng watch-position: unit test (fake timer: interval/throttle/flush) + e2e test (course có video thật trên apitest — seed demo không có video READY, ghi chú) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 4. CourseQa roll-up (course-qa-rollup)
- [x] 4.1 `useQueryCourseQuestionsSwr` → adapter thật (cây lesson từ useQueryLearnCourseSwr, fan-out getLessonComments chunk 5, map CommentView → CourseQuestion + href lesson); xóa `mock.ts`
  - DONE: `CourseQa/rollup.ts` (pure helpers `fetchCourseRollup` fan-out chunk 5 size 50/lesson, `mapCommentToQuestion`, `selectQuestionsPage`); hook fetch roll-up MỘT lần (key = course+lessonIds+currentUserId), filter/search/page client-side qua `useMemo`. Lesson 403 (thiếu FULL) → catch → đóng góp rỗng (course chưa có comment = empty state, không lỗi). `CourseQuestion` thêm `lessonId`+`lessonHref`; `QuestionRow` chip lesson → `Link` nhảy `/courses/{id}/learn/content/modules/{m}/contents/{lesson}`. `mock.ts` đã xoá. Author name chỉ có label you/member (comment API không có displayName) — xem BACKLOG.
- [x] 4.2 Composer chọn lesson đích → `usePostLessonCommentSwr` → revalidate roll-up; i18n `learn.qa.*`
  - DONE: composer Q&A thêm native `<select>` lesson đích (default lesson đầu) → `onSubmitQuestion` post `usePostLessonCommentSwr({lessonId, {content}})` qua `useRestWithToast` → `mutate()` revalidate roll-up. Answer = reply cùng lesson (`{parentId: question.id, content}`). i18n `learn.courseQa.{targetLessonLabel,viewLesson}` (vi+en); toast reuse `learn.comments.posted`. tsc `--noEmit` xanh.
- [ ] 4.3 Quality loop tính năng Q&A: unit test (mapper comment→question, chunk fan-out) + e2e test (post comment ở lesson → thấy trong Q&A → link nhảy đúng bài) → đánh giá vòng 1 → fix → đánh giá vòng 2
  - NOTE: FE chưa có test runner (cùng nợ 2.3/3.3/5.2) → unit/e2e chưa chạy; helper `rollup.ts` đã tách pure sẵn test. Verify: `tsc --noEmit` sạch. Xem BACKLOG-REVIEW.

## 5. isPurchased thật (course-purchase-flag-fe)
- [x] 5.1 `useQueryCourseDetailSwr`: đọc `isPurchased` từ enrollment; fallback `getMyCourseAccess` khi có token mà không khớp enrollment; xóa comment hardcode dòng 312-314
  - DONE: `matched = enrollments.find(slugName===courseId && active)` → `isPurchased = matched.isPurchased`. Fallback `useGetMyCourseAccessSwr(needAccessFallback ? data.rawId : undefined)` — gate `hasToken && enrollments!==undefined && !matched` (viewer mua PACKAGE có FULL access mà KHÔNG có enrollment row) → `isPurchased = access.purchased`, `isEnrolled = matched || access.enrolled`. Comment hardcode "leave it false" đã xoá. `CourseEnrollmentState` doc bỏ "mock-only". Anonymous/no-token → enrollments undefined → giữ default false (sales card). tsc `--noEmit` xanh.
- [ ] 5.2 Quality loop tính năng isPurchased: unit test (3 nhánh: purchased/enroll-free/anonymous) + e2e test (seed demo: account có purchase mở detail course package) → đánh giá vòng 1 → fix → đánh giá vòng 2
  - NOTE: FE chưa có test runner (cùng nợ 2.3/3.3/4.3) → unit/e2e chưa chạy. 3 nhánh cover được ở hook: (a) matched.isPurchased=true, (b) matched.isPurchased=false (free-enroll), (c) no-token → default false; nhánh fallback (purchased swithout enrollment) qua access.purchased. Verify: `tsc --noEmit` sạch.

## 6. Verify chung
- [ ] 6.1 `npm run build` xanh + `tsc --noEmit` sạch; `openspec validate learn-engagement-wire --strict` pass
