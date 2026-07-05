## ADDED Requirements

### Requirement: Course REST client reuses the shared REST wrapper
The course REST client SHALL import `restRequest` from `src/modules/api/rest/client/` and SHALL NOT create its own axios instance or envelope handling.

#### Scenario: List my certificates
- **WHEN** `getMyCertificates()` is called
- **THEN** it performs `GET /api/v1/courses/me/certificates` through `restRequest` and returns `Array<CertificateView>`

### Requirement: Catalog management endpoints are exposed via REST
The course REST client SHALL expose typed functions for every mutating endpoint in `CatalogController` except those already covered by GraphQL.

#### Scenario: Create course
- **WHEN** `createCourse(request)` is called
- **THEN** it performs `POST /api/v1/courses` and returns `CourseSummary`

#### Scenario: Update course
- **WHEN** `updateCourse(id, request)` is called
- **THEN** it performs `PATCH /api/v1/courses/{id}` and returns `CourseSummary`

#### Scenario: Publish course
- **WHEN** `publishCourse(id)` is called
- **THEN** it performs `POST /api/v1/courses/{id}/publish` and returns `CourseSummary`

#### Scenario: Archive course
- **WHEN** `archiveCourse(id)` is called
- **THEN** it performs `POST /api/v1/courses/{id}/archive` and returns `CourseSummary`

#### Scenario: Create section
- **WHEN** `createCourseSection(id, request)` is called
- **THEN** it performs `POST /api/v1/courses/{id}/sections` and returns `IdResponse`

#### Scenario: Update section
- **WHEN** `updateCourseSection(sectionId, request)` is called
- **THEN** it performs `PATCH /api/v1/courses/sections/{sectionId}` and returns `IdResponse`

#### Scenario: Delete section
- **WHEN** `deleteCourseSection(sectionId)` is called
- **THEN** it performs `DELETE /api/v1/courses/sections/{sectionId}` and resolves with `void`

#### Scenario: Reorder sections
- **WHEN** `reorderCourseSections(id, request)` is called
- **THEN** it performs `POST /api/v1/courses/{id}/sections/reorder` and resolves with `void`

#### Scenario: Create lesson
- **WHEN** `createCourseLesson(sectionId, request)` is called
- **THEN** it performs `POST /api/v1/courses/sections/{sectionId}/lessons` and returns `IdResponse`

#### Scenario: Update lesson
- **WHEN** `updateCourseLesson(lessonId, request)` is called
- **THEN** it performs `PATCH /api/v1/courses/lessons/{lessonId}` and returns `IdResponse`

#### Scenario: Delete lesson
- **WHEN** `deleteCourseLesson(lessonId)` is called
- **THEN** it performs `DELETE /api/v1/courses/lessons/{lessonId}` and resolves with `void`

#### Scenario: Request video upload URL
- **WHEN** `requestCourseVideoUploadUrl(lessonId, request)` is called
- **THEN** it performs `POST /api/v1/courses/lessons/{lessonId}/video/upload-url` and returns `UploadUrlResponse`

#### Scenario: Complete video upload
- **WHEN** `completeCourseVideoUpload(videoId)` is called
- **THEN** it performs `POST /api/v1/courses/videos/{videoId}/complete-upload` and resolves with `void`

### Requirement: Enrollment and package endpoints are exposed via REST
The course REST client SHALL expose `enrollDirect`, package list, and package creation, but SHALL skip `mutation-course-enroll` checkout because it already exists on GraphQL.

#### Scenario: Direct enroll
- **WHEN** `enrollCourseDirect(id)` is called
- **THEN** it performs `POST /api/v1/courses/{id}/enroll` and returns `EnrollResponse`

#### Scenario: List public packages
- **WHEN** `getCoursePackages(id)` is called
- **THEN** it performs `GET /api/v1/courses/{id}/packages` and returns `Array<PackageView>`

#### Scenario: Create package
- **WHEN** `createCoursePackage(id, request)` is called
- **THEN** it performs `POST /api/v1/courses/{id}/packages` and returns `PackageView`

### Requirement: Learning progress and personal annotations are exposed via REST
The course REST client SHALL expose progress reporting, lesson completion, bookmarks, and notes from `LearningController`.

#### Scenario: Report progress
- **WHEN** `reportLessonProgress(lessonId, request)` is called
- **THEN** it performs `PUT /api/v1/courses/lessons/{lessonId}/progress` and returns `ProgressView`

#### Scenario: Mark lesson complete
- **WHEN** `markLessonComplete(lessonId)` is called
- **THEN** it performs `POST /api/v1/courses/lessons/{lessonId}/complete` and returns `CompleteResponse`

#### Scenario: Add bookmark
- **WHEN** `addLessonBookmark(lessonId, request)` is called
- **THEN** it performs `POST /api/v1/courses/lessons/{lessonId}/bookmarks` and returns `BookmarkView`

#### Scenario: Delete bookmark
- **WHEN** `deleteLessonBookmark(lessonId, bookmarkId)` is called
- **THEN** it performs `DELETE /api/v1/courses/lessons/{lessonId}/bookmarks/{bookmarkId}` and resolves with `void`

#### Scenario: Add note
- **WHEN** `addLessonNote(lessonId, request)` is called
- **THEN** it performs `POST /api/v1/courses/lessons/{lessonId}/notes` and returns `NoteView`

#### Scenario: Update note
- **WHEN** `updateLessonNote(lessonId, noteId, request)` is called
- **THEN** it performs `PATCH /api/v1/courses/lessons/{lessonId}/notes/{noteId}` and returns `NoteView`

#### Scenario: Delete note
- **WHEN** `deleteLessonNote(lessonId, noteId)` is called
- **THEN** it performs `DELETE /api/v1/courses/lessons/{lessonId}/notes/{noteId}` and resolves with `void`

### Requirement: Freemium preview endpoints are exposed via REST
The course REST client SHALL expose document content upsert/read, preview config, AI chat limit, and preview-limit reporting from `FreemiumController`.

#### Scenario: Read lesson content
- **WHEN** `readLessonContent(lessonId)` is called
- **THEN** it performs `GET /api/v1/lessons/{lessonId}/content` and returns `LessonContentView`

#### Scenario: Upsert lesson content
- **WHEN** `upsertLessonContent(lessonId, request)` is called
- **THEN** it performs `PUT /api/v1/lessons/{lessonId}/content` and resolves with `void`

#### Scenario: Update lesson preview seconds
- **WHEN** `updateLessonPreview(lessonId, request)` is called
- **THEN** it performs `PATCH /api/v1/lessons/{lessonId}/preview` and resolves with `void`

#### Scenario: Update course preview default
- **WHEN** `updateCoursePreviewDefault(courseId, request)` is called
- **THEN** it performs `PATCH /api/v1/courses/{courseId}/preview-default` and resolves with `void`

#### Scenario: Update lesson AI chat limit
- **WHEN** `updateLessonAiChatLimit(lessonId, request)` is called
- **THEN** it performs `PATCH /api/v1/lessons/{lessonId}/ai-chat-limit` and resolves with `void`

#### Scenario: Report preview limit
- **WHEN** `reportPreviewLimit(lessonId, request)` is called
- **THEN** it performs `POST /api/v1/lessons/{lessonId}/preview-limit` and resolves with `void`

### Requirement: Assessment endpoints are exposed via REST
The course REST client SHALL expose assignment/quiz CRUD, submissions, attempts, and results from `AssessmentController`.

#### Scenario: Create assignment
- **WHEN** `createLessonAssignment(lessonId, request)` is called
- **THEN** it performs `POST /api/v1/courses/lessons/{lessonId}/assignments` and returns `IdResponse`

#### Scenario: List assignments
- **WHEN** `getLessonAssignments(lessonId)` is called
- **THEN** it performs `GET /api/v1/courses/lessons/{lessonId}/assignments` and returns `Array<AssignmentView>`

#### Scenario: Submit assignment
- **WHEN** `submitAssignment(assignmentId, request)` is called
- **THEN** it performs `POST /api/v1/courses/assignments/{assignmentId}/submissions` and returns `SubmissionView`

#### Scenario: List my assignment submissions
- **WHEN** `getMyAssignmentSubmissions(assignmentId)` is called
- **THEN** it performs `GET /api/v1/courses/assignments/{assignmentId}/submissions/me` and returns `Array<SubmissionView>`

#### Scenario: Create quiz
- **WHEN** `createLessonQuiz(lessonId, request)` is called
- **THEN** it performs `POST /api/v1/courses/lessons/{lessonId}/quizzes` and returns `IdResponse`

#### Scenario: Add quiz question
- **WHEN** `addQuizQuestion(quizId, request)` is called
- **THEN** it performs `POST /api/v1/courses/quizzes/{quizId}/questions` and returns `IdResponse`

#### Scenario: Publish quiz
- **WHEN** `publishQuiz(quizId)` is called
- **THEN** it performs `POST /api/v1/courses/quizzes/{quizId}/publish` and returns `IdResponse`

#### Scenario: Start quiz attempt
- **WHEN** `startQuizAttempt(quizId)` is called
- **THEN** it performs `POST /api/v1/courses/quizzes/{quizId}/attempts` and returns `QuizAttemptStartView`

#### Scenario: Submit quiz attempt
- **WHEN** `submitQuizAttempt(attemptId, request)` is called
- **THEN** it performs `PUT /api/v1/courses/quiz-attempts/{attemptId}/submit` and returns `QuizAttemptResultView`

### Requirement: Certificate endpoints are exposed via REST
The course REST client SHALL expose certificate verify, my certificates, and revoke.

#### Scenario: Verify certificate
- **WHEN** `verifyCertificate(code)` is called
- **THEN** it performs `GET /api/v1/courses/certificates/verify/{code}` and returns `CertificateVerifyView`

#### Scenario: Revoke certificate
- **WHEN** `revokeCertificate(id)` is called
- **THEN** it performs `POST /api/v1/courses/certificates/{id}/revoke` and resolves with `void`

### Requirement: SWR wrappers exist for every writing endpoint
For every POST/PUT/PATCH/DELETE course REST function, a corresponding `usePost*Swr` hook SHALL exist in `src/hooks/swr/api/rest/mutations/` following the existing naming and generic pattern.

#### Scenario: Use create course hook
- **WHEN** a component calls `usePostCreateCourseSwr().trigger(request)`
- **THEN** the hook invokes `createCourse(request)` through `useSWRMutation`

### Requirement: GraphQL-covered endpoints are documented and skipped
Endpoints already served by GraphQL (`query-courses`, `query-course`, `mutation-course-enroll`, `query-my-courses`, `query-my-course-outline`, `query-lesson-videos`) SHALL NOT receive REST clients in this change; the design SHALL list them with rationale.

#### Scenario: Course list remains GraphQL
- **WHEN** reviewing the catalog surface
- **THEN** `GET /api/v1/courses` and `GET /api/v1/courses/{slug}` are listed as GraphQL-covered and omitted
