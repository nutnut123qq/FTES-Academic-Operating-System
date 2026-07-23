# Tasks — learn-engagement-wire

## 1. REST + SWR layer
- [x] 1.1 `modules/api/rest/course`: `LessonReactionSummaryView` + `getLessonReactions`/`putLessonReaction`/`deleteLessonReaction`; `CourseAccessStateView` + `getMyCourseAccess`; `EnrollmentView.isPurchased`
  - reaction slice DONE (`LessonReactionSummaryView` + 3 fns + `LESSON_REACTION_LIKE`). isPurchased slice DONE: `EnrollmentView.isPurchased` (wire key is-prefixed) + `CourseAccessStateView` (`{courseId,enrolled,purchased,fullAccess}`, wire key `purchased`) + `getMyCourseAccess(courseRawId)` → `GET /courses/{id}/me/access` authenticated. Contract pinned từ BE `CourseDtos`/`CoursePurchaseFlagAuthIT` (me/access path var = course UUID = `course.rawId`, KHÔNG slug).
- [x] 1.2 SWR: `useGetLessonReactionsSwr`, `usePutLessonReactionSwr`, `useDeleteLessonReactionSwr`, `useGetMyCourseAccessSwr` + barrels
  - reaction hooks DONE (3 hooks + barrels queries/mutations). `useGetMyCourseAccessSwr` DONE: keyed trên `courseRawId` (UUID), `null` key gate (undefined → no fetch), `.catch(()=>null)` + `shouldRetryOnError:false` (401/404 degrade → null), export barrel queries.

## 2. Lesson reaction wire (lesson-reaction-wire)
- [x] 2.1 `LessonReactionFooter` → REST + optimistic toggle + rollback; disable like khi PREVIEW (tooltip enroll); xóa `useLessonReactionMock.ts`
- [x] 2.2 i18n `learn.reactions.likeGated` (vi+en)
- [x] 2.3 Quality loop tính năng reaction: unit test (map summary, optimistic rollback) + e2e test (seed demo: mở lesson thấy 42 view → like → unlike) → đánh giá vòng 1 → fix → đánh giá vòng 2
  - UNIT DONE 2026-07-22 (vitest đã có, note "chưa có test runner" đã stale): tách `LessonReactionFooter` + `toReactionSummary` ra file riêng `LessonReader/LessonReactionFooter.tsx` (index.tsx chỉ import lại — behavior giữ nguyên) để test được component private. Test `LessonReader/LessonReactionFooter.test.tsx` (6 PASS): map summary (LIKE→ReactionType.Like, 0 like→bucket rỗng), optimistic +1 tức thì khi PUT in-flight → commit server truth, ROLLBACK khi PUT fail, DELETE unlike + rollback, PREVIEW disabled + `reactions.likeGated` + không bắn PUT. Dùng SWR/hook THẬT (chỉ mock module REST + InteractionBar probe). E2E CÒN NỢ (cần Playwright + seed apitest).

## 3. Watch-position reporter (watch-position-report)
- [x] 3.1 Hook `useWatchPositionReporter` (interval 30s khi playing, flush pause/seek/unmount/visibilitychange, throttle 5s) — KHÔNG đụng flow complete 50%
  - DONE: `LessonReader/hooks/useWatchPositionReporter.ts`. Signature thực tế `{lessonId, getSnapshot}` → trả `{onPlaying, onPaused, onSeeked}` (imperative, hợp player event-driven hơn `isPlaying` prop trong design). PUT `/courses/lessons/{id}/progress` qua `usePostReportLessonProgressSwr`; unmount/visibility flush dùng `reportLessonProgress` trực tiếp (beacon, tránh setState sau unmount). Throttle 5s; pause/hide/unmount bypass throttle (giữ resume point). KHÔNG gọi mark-complete — flow 50% giữ nguyên.
- [x] 3.2 Gắn vào player VIDEO trong `LessonReader`
  - DONE: `LessonHlsPlayer` (onPlay/onPause/onEnded/onSeeked trên `<video>` thật) + `LessonYouTubePlayer` (onStateChange PLAYING→onPlaying, else→onPaused; playerRef cho getSnapshot; nhận thêm prop `lessonId`).
- [x] 3.3 Quality loop tính năng watch-position: unit test (fake timer: interval/throttle/flush) + e2e test (course có video thật trên apitest — seed demo không có video READY, ghi chú) → đánh giá vòng 1 → fix → đánh giá vòng 2
  - UNIT DONE 2026-07-22: `LessonReader/hooks/useWatchPositionReporter.test.ts` (6 PASS, vi.useFakeTimers — vitest fake luôn Date nên throttle wall-clock deterministic): interval 30s khi playing (2 PUT đúng payload watched/duration), throttle 5s gộp seek burst, seek nhỏ <5s bỏ qua, pause = flush bypass throttle + dừng interval, unmount = BEACON qua `reportLessonProgress` trực tiếp (KHÔNG qua SWR trigger), position 0 không gửi gì. E2E CÒN NỢ (cần video READY thật trên apitest).

## 4. CourseQa roll-up (course-qa-rollup)
- [x] 4.1 `useQueryCourseQuestionsSwr` → adapter thật (cây lesson từ useQueryLearnCourseSwr, fan-out getLessonComments chunk 5, map CommentView → CourseQuestion + href lesson); xóa `mock.ts`
  - DONE: `CourseQa/rollup.ts` (pure helpers `fetchCourseRollup` fan-out chunk 5 size 50/lesson, `mapCommentToQuestion`, `selectQuestionsPage`); hook fetch roll-up MỘT lần (key = course+lessonIds+currentUserId), filter/search/page client-side qua `useMemo`. Lesson 403 (thiếu FULL) → catch → đóng góp rỗng (course chưa có comment = empty state, không lỗi). `CourseQuestion` thêm `lessonId`+`lessonHref`; `QuestionRow` chip lesson → `Link` nhảy `/courses/{id}/learn/content/modules/{m}/contents/{lesson}`. `mock.ts` đã xoá. Author name chỉ có label you/member (comment API không có displayName) — xem BACKLOG.
- [x] 4.2 Composer chọn lesson đích → `usePostLessonCommentSwr` → revalidate roll-up; i18n `learn.qa.*`
  - DONE: composer Q&A thêm native `<select>` lesson đích (default lesson đầu) → `onSubmitQuestion` post `usePostLessonCommentSwr({lessonId, {content}})` qua `useRestWithToast` → `mutate()` revalidate roll-up. Answer = reply cùng lesson (`{parentId: question.id, content}`). i18n `learn.courseQa.{targetLessonLabel,viewLesson}` (vi+en); toast reuse `learn.comments.posted`. tsc `--noEmit` xanh.
- [x] 4.3 Quality loop tính năng Q&A: unit test (mapper comment→question, chunk fan-out) + e2e test (post comment ở lesson → thấy trong Q&A → link nhảy đúng bài) → đánh giá vòng 1 → fix → đánh giá vòng 2
  - UNIT DONE 2026-07-22: `CourseQa/rollup.test.ts` (8 PASS): mapper (label you/member, lessonId/href anchor, replies DELETED/anon bị lọc), fan-out chunk (đo in-flight max = 5 với 7 lesson, merge sort newest-first, đúng `{page:1,size:50}`), lesson 403/lỗi đóng góp rỗng không fail roll-up, skip top-level tombstone/anon, `selectQuestionsPage` filter unanswered/answered/mine + search body/lessonTitle case-insensitive + paging 20/trang. E2E CÒN NỢ.

## 5. isPurchased thật (course-purchase-flag-fe)
- [x] 5.1 `useQueryCourseDetailSwr`: đọc `isPurchased` từ enrollment; fallback `getMyCourseAccess` khi có token mà không khớp enrollment; xóa comment hardcode dòng 312-314
  - DONE: `matched = enrollments.find(slugName===courseId && active)` → `isPurchased = matched.isPurchased`. Fallback `useGetMyCourseAccessSwr(needAccessFallback ? data.rawId : undefined)` — gate `hasToken && enrollments!==undefined && !matched` (viewer mua PACKAGE có FULL access mà KHÔNG có enrollment row) → `isPurchased = access.purchased`, `isEnrolled = matched || access.enrolled`. Comment hardcode "leave it false" đã xoá. `CourseEnrollmentState` doc bỏ "mock-only". Anonymous/no-token → enrollments undefined → giữ default false (sales card). tsc `--noEmit` xanh.
- [x] 5.2 Quality loop tính năng isPurchased: unit test (3 nhánh: purchased/enroll-free/anonymous) + e2e test (seed demo: account có purchase mở detail course package) → đánh giá vòng 1 → fix → đánh giá vòng 2
  - UNIT DONE 2026-07-22: `course/hooks/useQueryCourseDetailSwr.test.tsx` (5 PASS): (a) enrollment match isPurchased=true → purchased + KHÔNG gọi me/access, (b) match isPurchased=false → enrolled-not-purchased, (c) fallback me/access khi mua package không có enrollment row (key đúng rawId UUID) → purchased=true, (d) enrollments lỗi 500 → degrade sales card (false/false, không throw), (e) anonymous không token → không gọi enrollments, default false. E2E CÒN NỢ (account seed có purchase trên apitest).

## 6. Verify chung
- [ ] 6.1 `npm run build` xanh + `tsc --noEmit` sạch; `openspec validate learn-engagement-wire --strict` pass

## Nghiệm thu E2E 2026-07-23 (Playwright local :3000 → apitest, spec e2e/learn-engagement-wire.spec.ts)
- Q&A: PASS — post comment → roll-up "Xem tất cả câu hỏi" → link nhảy đúng bài.
- FAIL (REGRESSION): LessonReactionFooter (view count + like) KHÔNG render trên bất kỳ lesson seed nào — DOCUMENT đi qua DocumentReader (LessonReader/index.tsx:319) bỏ mất footer; lesson VIDEO không body rơi vào isReadingEmpty cũng ẩn footer. FE không bao giờ bắn GET /reactions (API-level vẫn OK: viewCount 42, PUT/DELETE 200 khi gọi tay).
- Watch-position: BLOCKED-DATA — student không có khoá đã mua nào videoStatus=READY.
