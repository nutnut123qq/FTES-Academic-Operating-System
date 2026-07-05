## 1. Course REST types

- [x] 1.1 Create `src/modules/api/rest/course/types.ts` with request/response interfaces inferred from backend `CourseDtos`.

## 2. Course REST client

- [x] 2.1 Create `src/modules/api/rest/course/course.ts` exporting REST functions for all six course controllers.
- [x] 2.2 Create `src/modules/api/rest/course/index.ts` barrel re-exporting types and functions.
- [x] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./course"`.

### Endpoint mapping

**GraphQL-covered — BỎ QUA (ghi trong design.md):**
- `GET /api/v1/courses` → `query-courses`
- `GET /api/v1/courses/{slug}` → `query-course`
- `POST /api/v1/courses/{id}/enroll` → `mutation-course-enroll`
- `GET /api/v1/courses/me/enrollments` → `query-my-courses`
- `GET /api/v1/courses/lessons/{lessonId}/stream` → lesson video GraphQL flow
- `GET /api/v1/lessons/{lessonId}/content` read + outline → `query-my-course-outline`

**REST-only — implement in `course.ts`:**
- Catalog: `createCourse`, `updateCourse`, `publishCourse`, `archiveCourse`, `createCourseSection`, `updateCourseSection`, `deleteCourseSection`, `reorderCourseSections`, `createCourseLesson`, `updateCourseLesson`, `deleteCourseLesson`, `requestCourseVideoUploadUrl`, `completeCourseVideoUpload`
- Enrollment: `enrollCourseDirect`, `getCoursePackages`, `createCoursePackage`
- Learning: `reportLessonProgress`, `markLessonComplete`, `addLessonBookmark`, `deleteLessonBookmark`, `addLessonNote`, `updateLessonNote`, `deleteLessonNote`
- Freemium: `readLessonContent`, `upsertLessonContent`, `updateLessonPreview`, `updateCoursePreviewDefault`, `updateLessonAiChatLimit`, `reportPreviewLimit`
- Assessment: `createLessonAssignment`, `getLessonAssignments`, `submitAssignment`, `getMyAssignmentSubmissions`, `createLessonQuiz`, `addQuizQuestion`, `publishQuiz`, `startQuizAttempt`, `submitQuizAttempt`
- Certificate: `verifyCertificate`, `getMyCertificates`, `revokeCertificate`

## 3. SWR mutation wrappers

- [x] 3.1 Create `usePostCreateCourseSwr.ts`
- [x] 3.2 Create `usePostUpdateCourseSwr.ts`
- [x] 3.3 Create `usePostPublishCourseSwr.ts`
- [x] 3.4 Create `usePostArchiveCourseSwr.ts`
- [x] 3.5 Create `usePostCreateCourseSectionSwr.ts`
- [x] 3.6 Create `usePostUpdateCourseSectionSwr.ts`
- [x] 3.7 Create `usePostDeleteCourseSectionSwr.ts`
- [x] 3.8 Create `usePostReorderCourseSectionsSwr.ts`
- [x] 3.9 Create `usePostCreateCourseLessonSwr.ts`
- [x] 3.10 Create `usePostUpdateCourseLessonSwr.ts`
- [x] 3.11 Create `usePostDeleteCourseLessonSwr.ts`
- [x] 3.12 Create `usePostRequestCourseVideoUploadUrlSwr.ts`
- [x] 3.13 Create `usePostCompleteCourseVideoUploadSwr.ts`
- [x] 3.14 Create `usePostEnrollCourseDirectSwr.ts`
- [x] 3.15 Create `usePostCreateCoursePackageSwr.ts`
- [x] 3.16 Create `usePostReportLessonProgressSwr.ts`
- [x] 3.17 Create `usePostMarkLessonCompleteSwr.ts`
- [x] 3.18 Create `usePostAddLessonBookmarkSwr.ts`
- [x] 3.19 Create `usePostDeleteLessonBookmarkSwr.ts`
- [x] 3.20 Create `usePostAddLessonNoteSwr.ts`
- [x] 3.21 Create `usePostUpdateLessonNoteSwr.ts`
- [x] 3.22 Create `usePostDeleteLessonNoteSwr.ts`
- [x] 3.23 Create `usePostUpsertLessonContentSwr.ts`
- [x] 3.24 Create `usePostUpdateLessonPreviewSwr.ts`
- [x] 3.25 Create `usePostUpdateCoursePreviewDefaultSwr.ts`
- [x] 3.26 Create `usePostUpdateLessonAiChatLimitSwr.ts`
- [x] 3.27 Create `usePostReportPreviewLimitSwr.ts`
- [x] 3.28 Create `usePostCreateLessonAssignmentSwr.ts`
- [x] 3.29 Create `usePostSubmitAssignmentSwr.ts`
- [x] 3.30 Create `usePostCreateLessonQuizSwr.ts`
- [x] 3.31 Create `usePostAddQuizQuestionSwr.ts`
- [x] 3.32 Create `usePostPublishQuizSwr.ts`
- [x] 3.33 Create `usePostStartQuizAttemptSwr.ts`
- [x] 3.34 Create `usePostSubmitQuizAttemptSwr.ts`
- [x] 3.35 Create `usePostRevokeCertificateSwr.ts`
- [x] 3.36 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new hooks.

## 4. Verification

- [x] 4.1 Run `npx tsc --noEmit` and fix type errors.
- [x] 4.2 Run `npm run build` (webpack) and ensure a green build.
