/**
 * Request / response shapes for the course REST controller cluster.
 *
 * Inferred from backend `vn.ftes.aos.course.web.dto.CourseDtos` and the six
 * controllers: Catalog, Enrollment, Learning, Freemium, Assessment, Certificate.
 */

// ---------------------------------------------------------------- catalog

/** Body sent to `POST /api/v1/courses`. */
export interface CreateCourseRequest {
    title: string
    slugName: string
    courseCode: string
    saleMode: string
    level?: string | null
    term?: string | null
    description?: string | null
    contentCourse?: string | null
    infoCourse?: string | null
    categoryId?: string | null
    totalPrice?: string | null
    salePrice?: string | null
}

/** Body sent to `PATCH /api/v1/courses/{id}`. */
export interface UpdateCourseRequest {
    title?: string | null
    description?: string | null
    contentCourse?: string | null
    infoCourse?: string | null
    level?: string | null
    term?: string | null
    categoryId?: string | null
    totalPrice?: string | null
    salePrice?: string | null
    imageHeader?: string | null
}

/** Public course summary. */
export interface CourseSummary {
    id: string
    title: string
    slugName: string
    courseCode: string
    level: string
    status: string
    saleMode: string
    totalPrice: string
    salePrice: string
    avgStar: string
    totalUser: number
    imageHeader: string
    categoryId: string
    /** Total number of ratings this course has received. */
    ratingCount: number
}

/** Full public course detail. */
export interface CourseDetail {
    course: CourseSummary
    description: string
    contentCourse: string
    infoCourse: string
    sections: Array<SectionView>
}

/** Section inside course detail. */
export interface SectionView {
    id: string
    name: string
    description: string
    sortOrder: number
    lessons: Array<LessonView>
}

/** Lesson inside section view. */
export interface LessonView {
    id: string
    name: string
    description: string
    type: string
    sortOrder: number
    free: boolean
    locked: boolean
    videoStatus: string
    /** Legacy streaming ref (YouTube URL or `video_*` token) from the migrated video. */
    videoRef: string | null
    previewSeconds: number
    hasContent: boolean
    accessLevel: string | null
}

/** Query params for the public catalog list `GET /api/v1/courses`. */
export interface CourseListParams {
    /** Filter by opaque category id. */
    categoryId?: string | null
    /** Filter by course level. */
    level?: string | null
    /** Full-text search over title/description. */
    q?: string | null
    /** Zero-based page index (BE default 0). */
    page?: number
    /** Page size (BE default 20). */
    size?: number
}

/** Body sent to `POST /api/v1/courses/{id}/sections`. */
export interface CreateSectionRequest {
    name: string
    description?: string | null
    sortOrder: number
}

/** Body sent to `PATCH /api/v1/courses/sections/{sectionId}`. */
export interface UpdateSectionRequest {
    name?: string | null
    description?: string | null
    sortOrder?: number | null
}

/** Body sent to `POST /api/v1/courses/{id}/sections/reorder`. */
export interface ReorderRequest {
    orderedIds: Array<string>
}

/** Body sent to `POST /api/v1/courses/sections/{sectionId}/lessons`. */
export interface CreateLessonRequest {
    name: string
    description?: string | null
    type: string
    sortOrder: number
    free: boolean
}

/** Body sent to `PATCH /api/v1/courses/lessons/{lessonId}`. */
export interface UpdateLessonRequest {
    name?: string | null
    description?: string | null
    type?: string | null
    sortOrder?: number | null
    free?: boolean | null
}

/** Body sent to `POST .../video/upload-url`. */
export interface UploadUrlRequest {
    filename: string
    contentType?: string | null
}

/** Response from `POST .../video/upload-url`. */
export interface UploadUrlResponse {
    videoId: string
    url: string
    storageKey: string
}

/** Generic id response returned by many catalog endpoints. */
export interface IdResponse {
    id: string
}

/** Stream URL response. */
export interface StreamResponse {
    url: string
    ttlSeconds: number
}

// ---------------------------------------------------------------- freemium preview

/** Cheapest active package used in paywall/teaser. */
export interface CheapestPackage {
    id: string
    name: string
    salePrice: string
}

/** Teaser info when a lesson is locked behind preview. */
export interface TeaserInfo {
    reason: string
    cheapestPackage: CheapestPackage | null
}

/** Document lesson content. */
export interface LessonContentView {
    lessonId: string
    bodyMd: string
    readingMinutes: number | null
    locked: boolean
    teaser: TeaserInfo | null
    /** True when a PUBLISHED challenge is linked to this lesson (additive, defaults false). */
    hasChallenge?: boolean
}

/** Body sent to `PUT /api/v1/lessons/{lessonId}/content`. */
export interface UpsertContentRequest {
    bodyMd: string
    readingMinutes?: number | null
}

/** Body sent to `PATCH /api/v1/lessons/{lessonId}/preview`. */
export interface UpdatePreviewRequest {
    previewSeconds: number | null
}

/** Body sent to `PATCH /api/v1/courses/{courseId}/preview-default`. */
export interface UpdatePreviewDefaultRequest {
    defaultPreviewSeconds: number
}

/** Body sent to `POST /api/v1/lessons/{lessonId}/preview-limit`. */
export interface PreviewLimitRequest {
    watchedSeconds?: number | null
}

/** Body sent to `PATCH /api/v1/lessons/{lessonId}/ai-chat-limit`. */
export interface LessonAiChatLimitRequest {
    maxPerDay: number | null
}

/** Stream response with freemium preview metadata. */
export interface StreamViewResponse {
    url: string
    ttlSeconds: number
    mode: string
    previewSeconds: number
    cheapestPackage: CheapestPackage | null
}

/** A document/slide attachment of a lesson, with a signed read URL for embedding. */
export interface LessonDocumentView {
    id: string
    title: string
    /** Signed read URL (TTL-limited) — embed in an iframe (PDF/slide). */
    url: string
    mimeType: string | null
    sizeBytes: number | null
}

// ---------------------------------------------------------------- enrollment / packages

/** Response from `POST /api/v1/courses/{id}/enroll`. */
export interface EnrollResponse {
    enrollmentId: string
    courseId: string
    active: boolean
}

/** My enrollment row. */
export interface EnrollmentView {
    courseId: string
    courseTitle: string
    slugName: string
    active: boolean
    completionPercent: string
}

/** Course package view. */
export interface PackageView {
    id: string
    name: string
    slug: string
    status: string
    salePrice: string
    originalPrice: string
    descriptions: string
    sortOrder: number
    defaultPackage: boolean
    entitlements: Array<EntitlementView>
}

/** Entitlement inside a package. */
export interface EntitlementView {
    id: string
    type: string
    sectionId: string
    lessonId: string
    selectedLessonIds: Array<string>
    freeLessonIds: Array<string>
    selectedExerciseIds: Array<string>
    freeExerciseIds: Array<string>
}

/** Body sent to `POST /api/v1/courses/{id}/packages`. */
export interface CreatePackageRequest {
    name: string
    slug: string
    salePrice?: string | null
    originalPrice?: string | null
    descriptions?: string | null
    sortOrder?: number | null
    defaultPackage?: boolean | null
    entitlements?: Array<CreateEntitlementRequest> | null
}

/** Entitlement request item. */
export interface CreateEntitlementRequest {
    type: string
    sectionId?: string | null
    lessonId?: string | null
    selectedLessonIds?: Array<string> | null
    freeLessonIds?: Array<string> | null
    selectedExerciseIds?: Array<string> | null
    freeExerciseIds?: Array<string> | null
}

// ---------------------------------------------------------------- assignments

/** Assignment summary. */
export interface AssignmentView {
    id: string
    lessonId: string
    title: string
    question: string
    criteria: string
    fileExtension: string
    maxSubmissions: number
    free: boolean
    sortOrder: number
}

/** Body sent to `POST /api/v1/courses/lessons/{lessonId}/assignments`. */
export interface CreateAssignmentRequest {
    title: string
    question: string
    expectedOutput?: string | null
    criteria?: string | null
    checkLogic: boolean
    checkPerform: boolean
    checkEdgeCase: boolean
    fileExtension?: string | null
    sortOrder: number
    maxSubmissions?: number | null
    free: boolean
    testCases?: string | null
}

/** Body sent to `POST /api/v1/courses/assignments/{assignmentId}/submissions`. */
export interface SubmitAssignmentRequest {
    githubSubmissionUrl: string
}

/** Assignment submission summary. */
export interface CourseSubmissionView {
    id: string
    submissionAttempt: number
    status: string
    overallGrade: string | null
    aiScore: string | null
    evaluation: string
    submittedAt: string
}

// ---------------------------------------------------------------- quiz

/** Body sent to `POST /api/v1/courses/lessons/{lessonId}/quizzes`. */
export interface CreateQuizRequest {
    title: string
    description?: string | null
    passScorePercent: number
    timeLimitSeconds?: number | null
    maxAttempts?: number | null
    shuffleQuestions?: boolean | null
}

/** Body sent to `POST /api/v1/courses/quizzes/{quizId}/questions`. */
export interface CreateQuestionRequest {
    question: string
    type: string
    options: Array<OptionDto>
    correctKeys: Array<string>
    explanation?: string | null
    points?: number | null
    sortOrder: number
}

/** Quiz option. */
export interface OptionDto {
    key: string
    text: string
}

/** Question visible to quiz takers (no correct keys). */
export interface QuizQuestionTakerView {
    id: string
    question: string
    type: string
    options: Array<OptionDto>
    points: number
    sortOrder: number
}

/** Response when starting a quiz attempt. */
export interface QuizAttemptStartView {
    attemptId: string
    attemptNo: number
    timeLimitSeconds: number | null
    questions: Array<QuizQuestionTakerView>
}

/** Body sent to `PUT /api/v1/courses/quiz-attempts/{attemptId}/submit`. */
export interface SubmitQuizRequest {
    answers: Record<string, Array<string>>
}

/** Response after submitting a quiz attempt. */
export interface QuizAttemptResultView {
    attemptId: string
    scorePoints: number
    scorePercent: string
    passed: boolean
}

// ---------------------------------------------------------------- progress / learning

/** Body sent to `PUT /api/v1/courses/lessons/{lessonId}/progress`. */
export interface ProgressRequest {
    watchedSeconds: number
    videoDurationSeconds?: number | null
}

/** Progress response. */
export interface ProgressView {
    lessonId: string
    status: string
    watchedSeconds: number
    videoDurationSeconds: number | null
    courseCompletionPercent: string
}

/** Lesson completion response. */
export interface CompleteResponse {
    lessonId: string
    status: string
    courseCompletionPercent: string
}

/** One per-lesson progress row inside {@link CourseProgressView}. */
export interface LessonProgressItem {
    lessonId: string
    /** "IN_PROGRESS" | "COMPLETED". */
    status: string
    watchedSeconds: number
    videoDurationSeconds: number | null
}

/** The viewer's whole-course progress — overall percent + per-lesson rows. */
export interface CourseProgressView {
    courseId: string
    /** 0–100, 2-decimal string (envelope serializes BigDecimal as string). */
    completionPercent: string
    lessons: Array<LessonProgressItem>
}

/** Body sent to bookmark endpoints. */
export interface BookmarkRequest {
    positionSeconds: number
    label?: string | null
}

/** Bookmark view. */
export interface BookmarkView {
    id: string
    positionSeconds: number
    label: string
}

/** Body sent to note endpoints. */
export interface NoteRequest {
    content: string
    positionSeconds?: number | null
}

/** Note view. */
export interface NoteView {
    id: string
    content: string
    positionSeconds: number | null
    updatedAt: string
}

// ---------------------------------------------------------------- certificate

/** Certificate summary. */
export interface CertificateView {
    id: string
    certificateName: string
    certificateCode: string
    courseId: string
    issueDate: string
    completionPercentage: string
    active: boolean
}

/** Public certificate verification view. */
export interface CertificateVerifyView {
    certificateName: string
    holderName: string
    courseTitle: string
    issueDate: string
    active: boolean
}

// ---------------------------------------------------------------- course ratings

/** Body sent to `POST` / `PUT /api/v1/courses/{courseId}/ratings`. */
export interface CourseRatingRequest {
    /** 1–5 star score. */
    stars: number
    /** Optional free-text review. */
    review?: string
}

/** One course rating/review row. */
export interface CourseRatingItem {
    id: string
    userId: string
    stars: number
    review?: string
    createdAt: string
    updatedAt: string
}

/** Aggregate + paged reviews for a course (`GET /api/v1/courses/{courseId}/ratings`). */
export interface CourseRatingSummary {
    avgStar: number
    ratingCount: number
    items: Array<CourseRatingItem>
    page: number
    size: number
    total: number
}

// ---------------------------------------------------------------- lesson comments

/**
 * A threaded lesson-discussion comment. Top-level comments carry one level of
 * nested `replies`; reply rows carry an empty `replies` array. A deleted comment
 * comes back as a tombstone (`status: "DELETED"`, `content: "[bình luận đã xoá]"`,
 * `userId: null`) with its replies preserved.
 */
export interface LessonCommentView {
    id: string
    userId: string | null
    parentId: string | null
    content: string
    status: string
    createdAt: string
    reactionCount: number
    /** Reaction emoji strings the current viewer has applied (e.g. `["LIKE"]`). */
    myReactions: Array<string>
    replies: Array<LessonCommentView>
}

/** Body sent to `POST /api/v1/courses/lessons/{lessonId}/comments`. */
export interface PostLessonCommentRequest {
    /** Parent comment id when replying; omit/null for a top-level comment. */
    parentId?: string | null
    content: string
}

/** Paged lesson comments (`GET /api/v1/courses/lessons/{lessonId}/comments`). */
export interface LessonCommentsPage {
    items: Array<LessonCommentView>
    page: number
    size: number
    total: number
}
