import { restRequest } from "@/modules/api/rest/client"
import type {
    AssignmentView,
    BookmarkRequest,
    BookmarkView,
    CertificateVerifyView,
    CertificateView,
    CompleteResponse,
    CourseDetail,
    CourseListParams,
    CourseRatingItem,
    CourseRatingRequest,
    CourseRatingSummary,
    CourseSummary,
    CreateAssignmentRequest,
    CreateCourseRequest,
    CreateLessonRequest,
    CreatePackageRequest,
    CreateQuestionRequest,
    CreateQuizRequest,
    CreateSectionRequest,
    EnrollResponse,
    EnrollmentView,
    EntitlementView,
    IdResponse,
    LessonAiChatLimitRequest,
    LessonCommentsPage,
    LessonCommentView,
    LessonContentView,
    LessonDocumentView,
    NoteRequest,
    PostLessonCommentRequest,
    NoteView,
    PackageView,
    PreviewLimitRequest,
    ProgressRequest,
    ProgressView,
    QuizAttemptResultView,
    QuizAttemptStartView,
    ReorderRequest,
    StreamResponse,
    StreamViewResponse,
    SubmitAssignmentRequest,
    SubmitQuizRequest,
    CourseSubmissionView,
    UpdateCourseRequest,
    UpdateLessonRequest,
    UpdatePreviewDefaultRequest,
    UpdatePreviewRequest,
    UpdateSectionRequest,
    UploadUrlRequest,
    UploadUrlResponse,
    UpsertContentRequest,
} from "./types"

// ---------------------------------------------------------------- public catalog

/**
 * Lists published courses for the public catalog.
 *
 * `GET /api/v1/courses` (public). Returns the flat `CourseSummary` array the
 * BE envelope wraps; supports `categoryId` / `level` / `q` filters and paging.
 */
export const getCourses = async (
    params?: CourseListParams,
): Promise<Array<CourseSummary>> => {
    return restRequest<Array<CourseSummary>>({
        method: "GET",
        url: "/courses",
        authenticated: false,
        params: {
            categoryId: params?.categoryId ?? undefined,
            level: params?.level ?? undefined,
            q: params?.q ?? undefined,
            page: params?.page ?? undefined,
            size: params?.size ?? undefined,
        },
    })
}

/**
 * Reads one published course's detail by slug name.
 *
 * `GET /api/v1/courses/{slugName}`. NOTE the path variable is the `slugName`
 * (a uuid returns 404) — route with the slug the list returns.
 *
 * Sent AUTHENTICATED (token attached when present): the endpoint is public, but
 * for an enrolled viewer the BE unlocks the curriculum — real `videoRef`s,
 * `locked: false`. Anonymous callers (no token) get the public/locked view
 * unchanged. Forcing anon here stripped `videoRef` to null for enrolled users,
 * so the learn reader rendered no video on lessons the viewer had paid for.
 */
export const getCourseDetail = async (
    slugName: string,
): Promise<CourseDetail> => {
    return restRequest<CourseDetail>({
        method: "GET",
        url: `/courses/${slugName}`,
    })
}

// ---------------------------------------------------------------- catalog admin

/**
 * Creates a new course.
 *
 * `POST /api/v1/courses`
 */
export const createCourse = async (
    request: CreateCourseRequest,
): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "POST",
        url: "/courses",
        data: request,
    })
}

/**
 * Updates course metadata.
 *
 * `PATCH /api/v1/courses/{id}`
 */
export const updateCourse = async (
    id: string,
    request: UpdateCourseRequest,
): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "PATCH",
        url: `/courses/${id}`,
        data: request,
    })
}

/**
 * Publishes a course.
 *
 * `POST /api/v1/courses/{id}/publish`
 */
export const publishCourse = async (id: string): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "POST",
        url: `/courses/${id}/publish`,
    })
}

/**
 * Archives a course.
 *
 * `POST /api/v1/courses/{id}/archive`
 */
export const archiveCourse = async (id: string): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "POST",
        url: `/courses/${id}/archive`,
    })
}

/**
 * Creates a section inside a course.
 *
 * `POST /api/v1/courses/{id}/sections`
 */
export const createCourseSection = async (
    id: string,
    request: CreateSectionRequest,
): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "POST",
        url: `/courses/${id}/sections`,
        data: request,
    })
}

/**
 * Updates a section.
 *
 * `PATCH /api/v1/courses/sections/{sectionId}`
 */
export const updateCourseSection = async (
    sectionId: string,
    request: UpdateSectionRequest,
): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "PATCH",
        url: `/courses/sections/${sectionId}`,
        data: request,
    })
}

/**
 * Deletes a section.
 *
 * `DELETE /api/v1/courses/sections/{sectionId}`
 */
export const deleteCourseSection = async (sectionId: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/courses/sections/${sectionId}`,
    })
}

/**
 * Reorders sections inside a course.
 *
 * `POST /api/v1/courses/{id}/sections/reorder`
 */
export const reorderCourseSections = async (
    id: string,
    request: ReorderRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/courses/${id}/sections/reorder`,
        data: request,
    })
}

/**
 * Creates a lesson inside a section.
 *
 * `POST /api/v1/courses/sections/{sectionId}/lessons`
 */
export const createCourseLesson = async (
    sectionId: string,
    request: CreateLessonRequest,
): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "POST",
        url: `/courses/sections/${sectionId}/lessons`,
        data: request,
    })
}

/**
 * Updates a lesson.
 *
 * `PATCH /api/v1/courses/lessons/{lessonId}`
 */
export const updateCourseLesson = async (
    lessonId: string,
    request: UpdateLessonRequest,
): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "PATCH",
        url: `/courses/lessons/${lessonId}`,
        data: request,
    })
}

/**
 * Deletes a lesson.
 *
 * `DELETE /api/v1/courses/lessons/{lessonId}`
 */
export const deleteCourseLesson = async (lessonId: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/courses/lessons/${lessonId}`,
    })
}

/**
 * Requests a presigned upload URL for a lesson video.
 *
 * `POST /api/v1/courses/lessons/{lessonId}/video/upload-url`
 */
export const requestCourseVideoUploadUrl = async (
    lessonId: string,
    request: UploadUrlRequest,
): Promise<UploadUrlResponse> => {
    return restRequest<UploadUrlResponse>({
        method: "POST",
        url: `/courses/lessons/${lessonId}/video/upload-url`,
        data: request,
    })
}

/**
 * Marks a video upload as complete.
 *
 * `POST /api/v1/courses/videos/{videoId}/complete-upload`
 */
export const completeCourseVideoUpload = async (
    videoId: string,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/courses/videos/${videoId}/complete-upload`,
    })
}

/**
 * Signed stream URL (3-level FULL/PREVIEW/NONE) for a lesson's video.
 *
 * `GET /api/v1/courses/lessons/{lessonId}/stream`
 */
export const getLessonStreamUrl = async (lessonId: string): Promise<StreamViewResponse> => {
    return restRequest<StreamViewResponse>({
        method: "GET",
        url: `/courses/lessons/${lessonId}/stream`,
        authenticated: true,
    })
}

/**
 * Lists a lesson's document/slide attachments with signed read URLs (for iframe embed).
 *
 * `GET /api/v1/lessons/{lessonId}/documents`
 */
export const getLessonDocuments = async (lessonId: string): Promise<Array<LessonDocumentView>> => {
    return restRequest<Array<LessonDocumentView>>({
        method: "GET",
        url: `/lessons/${lessonId}/documents`,
        authenticated: true,
    })
}

// ---------------------------------------------------------------- enrollment / packages

/**
 * Lists the current user's course enrollments.
 *
 * `GET /api/v1/courses/me/enrollments`
 */
export const getMyEnrollments = async (): Promise<Array<EnrollmentView>> => {
    return restRequest<Array<EnrollmentView>>({
        method: "GET",
        url: "/courses/me/enrollments",
        authenticated: true,
    })
}

/**
 * Directly enrolls the current user in a course.
 *
 * `POST /api/v1/courses/{id}/enroll`
 */
export const enrollCourseDirect = async (id: string): Promise<EnrollResponse> => {
    return restRequest<EnrollResponse>({
        method: "POST",
        url: `/courses/${id}/enroll`,
    })
}

/**
 * Lists public packages for a course.
 *
 * `GET /api/v1/courses/{id}/packages`
 */
export const getCoursePackages = async (
    id: string,
): Promise<Array<PackageView>> => {
    return restRequest<Array<PackageView>>({
        method: "GET",
        url: `/courses/${id}/packages`,
        authenticated: false,
    })
}

/**
 * Creates a package for a course.
 *
 * `POST /api/v1/courses/{id}/packages`
 */
export const createCoursePackage = async (
    id: string,
    request: CreatePackageRequest,
): Promise<PackageView> => {
    return restRequest<PackageView>({
        method: "POST",
        url: `/courses/${id}/packages`,
        data: request,
    })
}

// ---------------------------------------------------------------- learning

/**
 * Reports video watch progress for a lesson.
 *
 * `PUT /api/v1/courses/lessons/{lessonId}/progress`
 */
export const reportLessonProgress = async (
    lessonId: string,
    request: ProgressRequest,
): Promise<ProgressView> => {
    return restRequest<ProgressView>({
        method: "PUT",
        url: `/courses/lessons/${lessonId}/progress`,
        data: request,
    })
}

/**
 * Marks a lesson as complete.
 *
 * `POST /api/v1/courses/lessons/{lessonId}/complete`
 */
export const markLessonComplete = async (
    lessonId: string,
): Promise<CompleteResponse> => {
    return restRequest<CompleteResponse>({
        method: "POST",
        url: `/courses/lessons/${lessonId}/complete`,
    })
}

/**
 * Adds a bookmark to a lesson.
 *
 * `POST /api/v1/courses/lessons/{lessonId}/bookmarks`
 */
export const addLessonBookmark = async (
    lessonId: string,
    request: BookmarkRequest,
): Promise<BookmarkView> => {
    return restRequest<BookmarkView>({
        method: "POST",
        url: `/courses/lessons/${lessonId}/bookmarks`,
        data: request,
    })
}

/**
 * Deletes a lesson bookmark.
 *
 * `DELETE /api/v1/courses/lessons/{lessonId}/bookmarks/{bookmarkId}`
 */
export const deleteLessonBookmark = async (
    lessonId: string,
    bookmarkId: string,
): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/courses/lessons/${lessonId}/bookmarks/${bookmarkId}`,
    })
}

/**
 * Adds a note to a lesson.
 *
 * `POST /api/v1/courses/lessons/{lessonId}/notes`
 */
export const addLessonNote = async (
    lessonId: string,
    request: NoteRequest,
): Promise<NoteView> => {
    return restRequest<NoteView>({
        method: "POST",
        url: `/courses/lessons/${lessonId}/notes`,
        data: request,
    })
}

/**
 * Updates a lesson note.
 *
 * `PATCH /api/v1/courses/lessons/{lessonId}/notes/{noteId}`
 */
export const updateLessonNote = async (
    lessonId: string,
    noteId: string,
    request: NoteRequest,
): Promise<NoteView> => {
    return restRequest<NoteView>({
        method: "PATCH",
        url: `/courses/lessons/${lessonId}/notes/${noteId}`,
        data: request,
    })
}

/**
 * Deletes a lesson note.
 *
 * `DELETE /api/v1/courses/lessons/{lessonId}/notes/{noteId}`
 */
export const deleteLessonNote = async (
    lessonId: string,
    noteId: string,
): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/courses/lessons/${lessonId}/notes/${noteId}`,
    })
}

// ---------------------------------------------------------------- freemium

/**
 * Reads the document content of a lesson.
 *
 * `GET /api/v1/lessons/{lessonId}/content`
 */
export const readLessonContent = async (
    lessonId: string,
): Promise<LessonContentView> => {
    return restRequest<LessonContentView>({
        method: "GET",
        url: `/lessons/${lessonId}/content`,
    })
}

/**
 * Creates or updates the document content of a lesson.
 *
 * `PUT /api/v1/lessons/{lessonId}/content`
 */
export const upsertLessonContent = async (
    lessonId: string,
    request: UpsertContentRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "PUT",
        url: `/lessons/${lessonId}/content`,
        data: request,
    })
}

/**
 * Updates the preview window for a lesson.
 *
 * `PATCH /api/v1/lessons/{lessonId}/preview`
 */
export const updateLessonPreview = async (
    lessonId: string,
    request: UpdatePreviewRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "PATCH",
        url: `/lessons/${lessonId}/preview`,
        data: request,
    })
}

/**
 * Updates the default preview window for a course.
 *
 * `PATCH /api/v1/courses/{courseId}/preview-default`
 */
export const updateCoursePreviewDefault = async (
    courseId: string,
    request: UpdatePreviewDefaultRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "PATCH",
        url: `/courses/${courseId}/preview-default`,
        data: request,
    })
}

/**
 * Sets the AI chat limit for a lesson.
 *
 * `PATCH /api/v1/lessons/{lessonId}/ai-chat-limit`
 */
export const updateLessonAiChatLimit = async (
    lessonId: string,
    request: LessonAiChatLimitRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "PATCH",
        url: `/lessons/${lessonId}/ai-chat-limit`,
        data: request,
    })
}

/**
 * Reports that the user hit the preview limit of a lesson.
 *
 * `POST /api/v1/lessons/{lessonId}/preview-limit`
 */
export const reportPreviewLimit = async (
    lessonId: string,
    request?: PreviewLimitRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/lessons/${lessonId}/preview-limit`,
        data: request,
    })
}

// ---------------------------------------------------------------- assessment

/**
 * Creates an assignment inside a lesson.
 *
 * `POST /api/v1/courses/lessons/{lessonId}/assignments`
 */
export const createLessonAssignment = async (
    lessonId: string,
    request: CreateAssignmentRequest,
): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "POST",
        url: `/courses/lessons/${lessonId}/assignments`,
        data: request,
    })
}

/**
 * Lists assignments for a lesson.
 *
 * `GET /api/v1/courses/lessons/{lessonId}/assignments`
 */
export const getLessonAssignments = async (
    lessonId: string,
): Promise<Array<AssignmentView>> => {
    return restRequest<Array<AssignmentView>>({
        method: "GET",
        url: `/courses/lessons/${lessonId}/assignments`,
    })
}

/**
 * Submits an assignment.
 *
 * `POST /api/v1/courses/assignments/{assignmentId}/submissions`
 */
export const submitAssignment = async (
    assignmentId: string,
    request: SubmitAssignmentRequest,
): Promise<CourseSubmissionView> => {
    return restRequest<CourseSubmissionView>({
        method: "POST",
        url: `/courses/assignments/${assignmentId}/submissions`,
        data: request,
    })
}

/**
 * Lists the current user's submissions for an assignment.
 *
 * `GET /api/v1/courses/assignments/{assignmentId}/submissions/me`
 */
export const getMyAssignmentSubmissions = async (
    assignmentId: string,
): Promise<Array<CourseSubmissionView>> => {
    return restRequest<Array<CourseSubmissionView>>({
        method: "GET",
        url: `/courses/assignments/${assignmentId}/submissions/me`,
    })
}

/**
 * Creates a quiz inside a lesson.
 *
 * `POST /api/v1/courses/lessons/{lessonId}/quizzes`
 */
export const createLessonQuiz = async (
    lessonId: string,
    request: CreateQuizRequest,
): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "POST",
        url: `/courses/lessons/${lessonId}/quizzes`,
        data: request,
    })
}

/**
 * Adds a question to a quiz.
 *
 * `POST /api/v1/courses/quizzes/{quizId}/questions`
 */
export const addQuizQuestion = async (
    quizId: string,
    request: CreateQuestionRequest,
): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "POST",
        url: `/courses/quizzes/${quizId}/questions`,
        data: request,
    })
}

/**
 * Publishes a quiz.
 *
 * `POST /api/v1/courses/quizzes/{quizId}/publish`
 */
export const publishQuiz = async (quizId: string): Promise<IdResponse> => {
    return restRequest<IdResponse>({
        method: "POST",
        url: `/courses/quizzes/${quizId}/publish`,
    })
}

/**
 * Starts a quiz attempt.
 *
 * `POST /api/v1/courses/quizzes/{quizId}/attempts`
 */
export const startQuizAttempt = async (
    quizId: string,
): Promise<QuizAttemptStartView> => {
    return restRequest<QuizAttemptStartView>({
        method: "POST",
        url: `/courses/quizzes/${quizId}/attempts`,
    })
}

/**
 * Submits a quiz attempt.
 *
 * `PUT /api/v1/courses/quiz-attempts/{attemptId}/submit`
 */
export const submitQuizAttempt = async (
    attemptId: string,
    request: SubmitQuizRequest,
): Promise<QuizAttemptResultView> => {
    return restRequest<QuizAttemptResultView>({
        method: "PUT",
        url: `/courses/quiz-attempts/${attemptId}/submit`,
        data: request,
    })
}

// ---------------------------------------------------------------- certificate

/**
 * Verifies a certificate by code (public).
 *
 * `GET /api/v1/courses/certificates/verify/{code}`
 */
export const verifyCertificate = async (
    code: string,
): Promise<CertificateVerifyView> => {
    return restRequest<CertificateVerifyView>({
        method: "GET",
        url: `/courses/certificates/verify/${code}`,
        authenticated: false,
    })
}

/**
 * Lists the current user's certificates.
 *
 * `GET /api/v1/courses/me/certificates`
 */
export const getMyCertificates = async (): Promise<Array<CertificateView>> => {
    return restRequest<Array<CertificateView>>({
        method: "GET",
        url: "/courses/me/certificates",
    })
}

/**
 * Revokes a certificate.
 *
 * `POST /api/v1/courses/certificates/{id}/revoke`
 */
export const revokeCertificate = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/courses/certificates/${id}/revoke`,
    })
}

// ---------------------------------------------------------------- course ratings

/**
 * Reads a course's aggregate rating + a page of reviews.
 *
 * `GET /api/v1/courses/{courseId}/ratings?page=&size=` (public). `courseId` is the
 * course UUID (`course.rawId`), NOT the slug.
 */
export const getCourseRatings = async (
    courseId: string,
    params?: { page?: number; size?: number },
): Promise<CourseRatingSummary> => {
    return restRequest<CourseRatingSummary>({
        method: "GET",
        url: `/courses/${courseId}/ratings`,
        params: {
            page: params?.page ?? 1,
            size: params?.size ?? 10,
        },
        authenticated: false,
    })
}

/**
 * Reads the current user's own rating for a course, or `null` when they have not
 * rated it yet (BE returns `data: null` on success).
 *
 * `GET /api/v1/courses/{courseId}/ratings/me`
 */
export const getMyCourseRating = async (
    courseId: string,
): Promise<CourseRatingItem | null> => {
    return restRequest<CourseRatingItem | null>({
        method: "GET",
        url: `/courses/${courseId}/ratings/me`,
        authenticated: true,
    })
}

/**
 * Creates or updates (upsert) the current user's rating for a course.
 *
 * `POST /api/v1/courses/{courseId}/ratings`. Returns 403 `COURSE_ACCESS_DENIED`
 * when the viewer lacks FULL access (not enrolled/bought).
 */
export const rateCourse = async (
    courseId: string,
    request: CourseRatingRequest,
): Promise<CourseRatingItem> => {
    return restRequest<CourseRatingItem>({
        method: "POST",
        url: `/courses/${courseId}/ratings`,
        data: request,
    })
}

/**
 * Deletes the current user's rating for a course.
 *
 * `DELETE /api/v1/courses/{courseId}/ratings`
 */
export const deleteCourseRating = async (courseId: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/courses/${courseId}/ratings`,
    })
}

// ---------------------------------------------------------------- lesson comments

/**
 * Reads a page of a lesson's threaded discussion (top-level newest first, one level
 * of nested replies oldest first).
 *
 * `GET /api/v1/courses/lessons/{lessonId}/comments?page=&size=` (auth + FULL access).
 */
export const getLessonComments = async (
    lessonId: string,
    params?: { page?: number; size?: number },
): Promise<LessonCommentsPage> => {
    return restRequest<LessonCommentsPage>({
        method: "GET",
        url: `/courses/lessons/${lessonId}/comments`,
        params: {
            page: params?.page ?? 1,
            size: params?.size ?? 20,
        },
        authenticated: true,
    })
}

/**
 * Posts a comment (or a reply, via `parentId`) on a lesson. A reply-of-reply is
 * auto-reparented to the root by the BE.
 *
 * `POST /api/v1/courses/lessons/{lessonId}/comments`
 */
export const postLessonComment = async (
    lessonId: string,
    request: PostLessonCommentRequest,
): Promise<LessonCommentView> => {
    return restRequest<LessonCommentView>({
        method: "POST",
        url: `/courses/lessons/${lessonId}/comments`,
        data: request,
    })
}

/**
 * Deletes a lesson comment (owner or course manager). The comment returns as a
 * tombstone (`status: "DELETED"`) with its replies preserved.
 *
 * `DELETE /api/v1/courses/comments/{commentId}`
 */
export const deleteLessonComment = async (commentId: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/courses/comments/${commentId}`,
    })
}

/**
 * Adds an emoji reaction to a lesson comment (e.g. `"LIKE"`).
 *
 * `POST /api/v1/courses/comments/{commentId}/reactions/{emoji}`
 */
export const reactLessonComment = async (
    commentId: string,
    emoji: string,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/courses/comments/${commentId}/reactions/${emoji}`,
    })
}

/**
 * Removes an emoji reaction from a lesson comment.
 *
 * `DELETE /api/v1/courses/comments/{commentId}/reactions/{emoji}`
 */
export const unreactLessonComment = async (
    commentId: string,
    emoji: string,
): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/courses/comments/${commentId}/reactions/${emoji}`,
    })
}
