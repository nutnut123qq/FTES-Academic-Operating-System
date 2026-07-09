# Course engagement FE (course ratings + lesson discussion)

## Why

Two backend features are LIVE at `https://apitest.ftes.vn/api/v1` but the FE still
renders mock/placeholder UI for them:

- **Course rating** — the course detail page hardcodes `rating.count = 0` and renders
  a mock `course.reviews` block. The BE now serves real aggregate + paged reviews plus
  a per-user upsert/delete rating API, and `CourseSummary.ratingCount`.
- **Lesson discussion** — the in-reader comment panel uses a mock hook with a static
  two-comment array and session-only optimistic posts. The BE now serves a real
  threaded comment API (one level of replies), emoji reactions and owner delete.

This change wires both to the real endpoints through the strict 3-tier data flow.

## What Changes

- **REST layer** (`modules/api/rest/course`): add rating + comment request/response
  types; add `getCourseRatings`, `getMyCourseRating`, `rateCourse`, `deleteCourseRating`,
  `getLessonComments`, `postLessonComment`, `deleteLessonComment`, `reactLessonComment`,
  `unreactLessonComment`. Add `ratingCount` to `CourseSummary`.
- **SWR wrappers** (`hooks/swr/api/rest`): `useGetCourseRatingsSwr`,
  `useGetMyCourseRatingSwr`, `useGetLessonCommentsSwr` (queries);
  `usePostRateCourseSwr`, `useDeleteCourseRatingSwr`, `usePostLessonCommentSwr`,
  `useDeleteLessonCommentSwr`, `usePostReactLessonCommentSwr`,
  `useDeleteReactLessonCommentSwr` (mutations) + barrels.
- **Course detail**: adapter wires the real `ratingCount` into `rating.count`; new
  `CourseDetail/CourseRatings` sub-component (aggregate + paged list + star composer with
  edit/delete) replaces the mock reviews block, keyed on `course.rawId`.
- **Lesson reader**: the mock `useQueryLessonCommentsSwr` is removed; `LessonComments`
  renders the real threaded discussion (nested replies, per-thread reply composer, like
  toggle, owner delete, deleted-comment tombstone).
- **i18n**: `courseSystem.detail.rating.*` and extended `learn.comments.*` keys (vi + en).

## Impact

- Affected specs: course engagement (new).
- Affected code: `src/modules/api/rest/course/*`, `src/hooks/swr/api/rest/{queries,mutations}/*`,
  `src/components/features/course/CourseDetail/*`, `src/components/features/course/hooks/useQueryCourseDetailSwr.ts`,
  `src/components/features/learn/LessonReader/LessonComments/*`, `src/messages/{vi,en}.json`.
- No backend change; endpoints already deployed.
