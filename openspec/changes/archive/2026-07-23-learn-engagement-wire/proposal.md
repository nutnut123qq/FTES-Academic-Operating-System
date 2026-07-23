# Learn engagement wire (reaction thật + watch-position + Q&A roll-up + isPurchased)

## Why

4 mảnh engagement của learner còn mock/hụt dù contract BE có (hoặc sắp có ở change BE
`course-lesson-reaction` / `course-learn-contract-gaps`):

- **Like/view bài học**: `LessonReactionFooter` dùng `useLessonReactionMock` (localStorage +
  số bịa từ hash contentId) — BE sắp có `GET/PUT/DELETE /courses/lessons/{id}/reactions`.
- **Watch position**: `usePostReportLessonProgressSwr` đã viết nhưng **0 component gọi** —
  BE `PUT /courses/lessons/{id}/progress` đã LIVE (auto-complete ≥90% server-side). FE hiện
  chỉ tự gọi complete ở mốc 50% xem — GIỮ hành vi complete, chỉ THÊM report position để
  resume + analytics.
- **Q&A toàn khóa** (`CourseQa/`): mock 100% (`mock.ts`). Quyết định đã chốt: map theo
  **lesson comments sẵn có** (LessonCommentController V177) roll-up toàn khóa, KHÔNG dựng BE mới.
- **isPurchased**: `useQueryCourseDetailSwr.ts:314` hardcode `false` — BE thêm cờ ở
  `EnrollmentView` + `GET /courses/{id}/me/access`.

## What Changes

- **REST layer** (`modules/api/rest/course`): `getLessonReactions`, `putLessonReaction`,
  `deleteLessonReaction` + `LessonReactionSummaryView`; `EnrollmentView` thêm `isPurchased`;
  `getMyCourseAccess` (`CourseAccessStateView`).
- **SWR**: `useGetLessonReactionsSwr`, `usePutLessonReactionSwr`, `useDeleteLessonReactionSwr`,
  `useGetMyCourseAccessSwr` + barrels.
- **LessonReactionFooter**: thay `useLessonReactionMock` bằng REST (optimistic toggle like,
  viewCount từ BE); xóa file mock.
- **Watch-position reporter**: hook mới `useWatchPositionReporter(lessonId, playerRef)` gọi
  `usePostReportLessonProgressSwr` định kỳ 30s + on pause/seek/unmount khi đang xem video;
  KHÔNG đổi logic complete 50% hiện có.
- **CourseQa**: `useQueryCourseQuestionsSwr` bỏ `mock.ts` — roll-up từ `getLessonComments`
  của các lesson trong course (fan-out có giới hạn + map về `CourseQuestion` types hiện có,
  link về đúng lesson trong learn shell); composer post về lesson đang chọn.
- **Course detail**: map `isPurchased` thật từ enrollments/me-access; xóa comment hardcode.

## Capabilities

### New Capabilities
- `lesson-reaction-wire`: like/view thật trên LessonReader.
- `watch-position-report`: report vị trí xem video định kỳ.
- `course-qa-rollup`: Q&A toàn khóa từ lesson comments thật.
- `course-purchase-flag-fe`: cờ đã-mua thật trên course detail.

## Impact

- Affected code: `src/modules/api/rest/course/*`, `src/hooks/swr/api/rest/*`,
  `src/components/features/learn/{LessonReader,CourseQa}/*`,
  `src/components/features/course/hooks/{useQueryCourseDetailSwr,useCourseEnrollment}.ts`,
  `src/messages/{vi,en}.json`.
- Phụ thuộc BE: `course-lesson-reaction` (V212) + `course-learn-contract-gaps` deploy trước.
- Verify: `npm run build` xanh + `tsc --noEmit` sạch, click-through trên seed
  `course-demo-seed-dev`.
