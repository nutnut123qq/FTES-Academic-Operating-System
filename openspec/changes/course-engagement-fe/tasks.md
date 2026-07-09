# Tasks — course-engagement-fe

## 1. REST layer
- [x] 1.1 `course/types.ts`: add `ratingCount` to `CourseSummary`; add `CourseRatingRequest`,
      `CourseRatingItem`, `CourseRatingSummary`, `LessonCommentView`, `PostLessonCommentRequest`,
      `LessonCommentsPage`.
- [x] 1.2 `course/course.ts`: add `getCourseRatings`, `getMyCourseRating`, `rateCourse`,
      `deleteCourseRating`, `getLessonComments`, `postLessonComment`, `deleteLessonComment`,
      `reactLessonComment`, `unreactLessonComment`.

## 2. SWR wrappers
- [x] 2.1 Queries: `useGetCourseRatingsSwr`, `useGetMyCourseRatingSwr`, `useGetLessonCommentsSwr` + barrel.
- [x] 2.2 Mutations: `usePostRateCourseSwr`, `useDeleteCourseRatingSwr`, `usePostLessonCommentSwr`,
      `useDeleteLessonCommentSwr`, `usePostReactLessonCommentSwr`, `useDeleteReactLessonCommentSwr` + barrel.

## 3. Course rating UI
- [x] 3.1 Adapter `useQueryCourseDetailSwr.ts`: wire real `ratingCount` into `rating.count`.
- [x] 3.2 `CourseDetail/CourseRatings/index.tsx`: aggregate + paged list + star composer (upsert)
      with prefill, edit + delete; friendly 403 toast.
- [x] 3.3 Mount `CourseRatings` where the mock reviews block rendered (`course.rawId`).

## 4. Lesson discussion UI
- [x] 4.1 Remove mock `useQueryLessonCommentsSwr`.
- [x] 4.2 Rewrite `LessonComments/index.tsx`: threaded list, reply composer, like toggle,
      owner delete, deleted tombstone.

## 5. i18n + verify
- [x] 5.1 Add `courseSystem.detail.rating.*` and extended `learn.comments.*` to vi.json + en.json.
- [x] 5.2 `npx tsc --noEmit` clean.
- [x] 5.3 `npm run build` green.
