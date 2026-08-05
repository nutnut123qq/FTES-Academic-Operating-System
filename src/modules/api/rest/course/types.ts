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
    /** Instructor/mentor display name; null when the course has no resolvable mentor. */
    mentorName?: string | null
    /** Instructor/mentor avatar URL; null when absent. */
    mentorAvatarUrl?: string | null
    /** Number of lessons in the course (0 when none). */
    totalLessons?: number
    /** Short course description/summary; null when absent. */
    description?: string | null
}

/** Full public course detail. */
export interface CourseDetail {
    course: CourseSummary
    description: string
    contentCourse: string
    infoCourse: string
    sections: Array<SectionView>
    /**
     * The code of the subject this course is linked to (e.g. "MAD101"), or null when
     * the course has no linked subject. Lets the learn header route "Ôn tập" →
     * /subjects/{subjectCode}/practice and "Hỏi đáp" → /subjects/{subjectCode}/discussion.
     * Additive on the BE detail projection.
     */
    subjectCode?: string | null
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
    /** Slugs of the packages that unlock this lesson, ordered lowest→highest tier by the BE; `[0]` is the minimum tier. */
    packageSlugs?: string[]
    /**
     * True when an ACTIVE (PUBLISHED/RUNNING) challenge is linked to this lesson.
     * Served by the CourseReadApi curriculum, so it is present for EVERY lesson —
     * including VIDEO lessons that carry no `/content` markdown row (whose content
     * endpoint 404s). Additive, defaults false. Kept scalar for back-compat with
     * consumers that only need "does this lesson have a challenge"; the full set is
     * in {@link challenges}.
     */
    hasChallenge?: boolean
    /** Id of the linked ACTIVE challenge (present when `hasChallenge`). Additive. */
    challengeId?: string | null
    /**
     * ALL active (PUBLISHED/RUNNING) challenges attached to this lesson — NOT collapsed
     * to one, so a lesson carrying several exercises lists them all. Additive (BE change
     * per-lesson-exercises-in-curriculum); absent on older deployments → treat as empty.
     * The FE nests these as indented child rows under the lesson and routes each to its
     * per-type solver by {@link LessonChallengeSummary.type}.
     */
    challenges?: Array<LessonChallengeSummary>
}

/** One active challenge attached to a lesson, as listed in {@link LessonView.challenges}. */
export interface LessonChallengeSummary {
    id: string
    title: string
    /** URL-friendly id the solver route keys on (detail endpoint keys on slug, not uuid). */
    slug: string
    /** BE challenge type (either vocabulary — `MULTIPLE_CHOICE`/`CODE`/`ESSAY` or `CODING`/`SQL`/`UI_UX`/…). */
    type: string
    /** Lifecycle status (`PUBLISHED` | `RUNNING` | `CLOSED`). */
    status: string
    /**
     * True when this challenge is playable for trial/non-purchase learners on a lesson
     * they can already access at FULL (the "video free + challenge free" study-trial
     * model, mirroring the lesson/assignment free flag). Additive — older BE builds omit
     * it, so consumers coerce `?? false` (a missing flag means a gated, non-free challenge).
     */
    free?: boolean
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
    /** The BE lesson content-type ("VIDEO" | "DOCUMENT" | ...), additive. */
    contentType?: string
    /** True when a PUBLISHED challenge is linked to this lesson (additive, defaults false). */
    hasChallenge?: boolean
    /** Id of the linked PUBLISHED challenge (present when `hasChallenge`). */
    challengeId?: string | null
    /** True when a PUBLISHED quiz is linked to this lesson (additive, defaults false). */
    hasQuiz?: boolean
    /** Id of the linked PUBLISHED quiz (present when `hasQuiz`). */
    quizId?: string | null
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
    /**
     * Signed HLS master manifest URL — present (non-null) only for a `provider === "HLS"`
     * lesson whose `hls_manifest_key` is set. The BE sends `null` for a YouTube stream or
     * a legacy `video_*` token (the ref then arrives in {@link videoRef}), so this is
     * nullable and consumers must truthy-check before playing it directly.
     */
    url: string | null
    ttlSeconds: number
    mode: string
    previewSeconds: number
    cheapestPackage: CheapestPackage | null
    /**
     * Stream provider — "YOUTUBE" | "HLS". Optional: only sent by the
     * `freemium-youtube-preview-gate` BE change; absent on older deployments.
     */
    provider?: "YOUTUBE" | "HLS"
    /**
     * YouTube URL (or `video_*` token) returned even for PREVIEW so the client can
     * mount a gated player. Optional: absent on BE deployments that still hide the
     * ref when locked — PREVIEW then keeps the current no-player state.
     */
    videoRef?: string | null
    /** True → the BE relies on the client to enforce the preview cut (YouTube). Optional. */
    enforceClientGate?: boolean
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

/** Một thẻ ghi nhớ do người soạn (BE `FlashcardDtos.FlashcardView`). */
export interface LessonFlashcardView {
    id: string
    front: string
    back: string
    hint: string | null
    sortOrder: number
    /** Chỉ `PUBLISHED` tới tay học viên; `DRAFT` chỉ người quản khoá thấy. */
    status: string
    /**
     * `MANUAL` (soạn từ đầu) hoặc `AI_ACCEPTED` (nhận bản nháp AI rồi sửa). Cả hai đều đã QUA
     * TAY NGƯỜI nên màn ôn tập KHÔNG phân biệt — trường này dành cho màn soạn của instructor.
     */
    origin: string
}

/**
 * Đường đọc HỢP NHẤT của màn ôn tập (BE `GET /api/v1/courses/lessons/{id}/flashcards`).
 *
 * `source = "AUTHORED"` → bài CÓ bộ thẻ người soạn, dùng `cards` và KHÔNG gọi đường sinh AI.
 * `source = "AI"` → chưa có bộ tay, `cards` rỗng, giữ nguyên luồng sinh bằng AI kèm nhãn AI.
 */
export interface LessonFlashcardsView {
    lessonId: string
    source: "AUTHORED" | "AI"
    /** Caller có quyền soạn trên khoá này — dùng để ẩn/hiện lối vào màn soạn. */
    canManage: boolean
    /**
     * Người quản khoá nhận CẢ `DRAFT` lẫn `PUBLISHED` (BE lọc theo quyền, cùng một endpoint);
     * học viên chỉ nhận `PUBLISHED`. Thẻ đã xoá (`ARCHIVED`) không bao giờ trả về.
     */
    cards: Array<LessonFlashcardView>
}

/** Body tạo/sửa thẻ (BE `UpsertFlashcardRequest`). Ở đường PATCH mọi field đều tuỳ chọn. */
export interface UpsertFlashcardRequest {
    front?: string
    back?: string
    hint?: string | null
    sortOrder?: number
    /** `DRAFT` (chỉ người quản thấy) hoặc `PUBLISHED` (tới tay học viên). */
    status?: string
    /** `MANUAL` khi soạn tay, `AI_ACCEPTED` khi nhận bản nháp AI rồi sửa. */
    origin?: string
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
    /**
     * True only for a PAID enrollment (the viewer bought a package covering this
     * course). Wire key is `isPurchased` — the BE record component is is-prefixed
     * (`EnrollmentView.isPurchased()`), unlike {@link CourseAccessStateView.purchased}.
     */
    isPurchased: boolean
    /**
     * The course cover image URL (same field as {@link CourseSummary.imageHeader}).
     * Additive — supplied by the paired BE change (home-continue-image-and-mascot);
     * absent/`null` on older deployments → the continue-learning card shows an empty
     * framed surface instead of a thumbnail.
     */
    imageHeader?: string | null
    /**
     * The course publish status (`DRAFT` | `PUBLISHED` | `ARCHIVED`, same enum as
     * {@link CourseSummary.status}). Additive — the paired BE change ALSO excludes
     * unpublished courses from `GET /courses/me/enrollments` at the source; this
     * field lets the FE filter defensively too. Absent → the row is treated as
     * published (older BE, or a build that already pre-filtered), so the band is
     * never blanked by a missing flag.
     */
    status?: string | null
    /**
     * Boolean publish flag — an alternative to {@link status} some BE builds may
     * send. Additive; when present it takes precedence over {@link status} for the
     * FE publish gate. Absent → fall back to {@link status}, then to "published".
     */
    published?: boolean | null
    /**
     * When set, this enrollment's access is time-bound to a term and ENDS at this
     * instant (the term end). ISO-8601 (`Instant`); `null`/absent = permanent (the
     * course is not part of a term). Additive — mirrors {@link CourseAccessStateView.accessUntil}
     * so the my-courses band can show a "mở đến {date}" badge without an extra per-course
     * access fetch. Absent on older deployments → no badge.
     */
    accessUntil?: string | null
    /**
     * True when this enrollment's access was revoked because its term ended AND the
     * course still belongs to a term (the student was kicked → offer "mua lại / đăng ký
     * lại"). Additive, defaults false. Mirrors {@link CourseAccessStateView.expired}.
     */
    expired?: boolean
}

/**
 * The caller's own access state on a course (`GET /api/v1/courses/{id}/me/access`,
 * where `{id}` is the course UUID). Everyone-false for a stranger (never 403 — it's
 * the caller's own state); the course not existing / not being published → 404.
 */
export interface CourseAccessStateView {
    courseId: string
    /** Has an active enrollment (free or paid). */
    enrolled: boolean
    /** Holds a paid package purchase covering this course. Wire key is `purchased`. */
    purchased: boolean
    /** Resolves to FULL access (bought, free-owned, or otherwise entitled). */
    fullAccess: boolean
    /**
     * When set, the caller's access to this course is time-bound to a term and ENDS at
     * this instant (the term end). ISO-8601 (`Instant`). `null` = permanent access (the
     * course is not part of a term). Additive — older BE builds omit it → treat as null
     * (no deadline banner). Drives the learn-page "Quyền học của bạn mở đến {date}" notice.
     */
    accessUntil?: string | null
    /**
     * True when the caller HAD access that was revoked because its term ended AND the
     * course still belongs to a term — i.e. they were kicked and can re-buy / re-enroll.
     * Additive, defaults false. Drives the learn-page EXPIRED banner + "mua lại / đăng ký
     * lại" CTA (which reuses the canonical enroll flow, never a "VIP" upsell).
     */
    expired?: boolean
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

/**
 * Taker-safe quiz summary for a lesson (`GET /courses/lessons/{lessonId}/quizzes`).
 * No questions / correctKeys. `status` is only set on the manager (`?includeDrafts`)
 * branch; the `my*` fields are the caller's own attempt stats (null for a manager).
 */
export interface QuizSummaryView {
    id: string
    lessonId: string
    title: string
    description: string | null
    passScorePercent: number
    timeLimitSeconds: number | null
    maxAttempts: number | null
    questionCount: number
    status: string | null
    myAttemptCount: number | null
    myBestPercent: string | null
    myPassed: boolean | null
}

/** One of the caller's own attempts on a quiz (`GET /courses/quizzes/{quizId}/attempts/me`). */
export interface QuizAttemptHistoryView {
    attemptId: string
    attemptNo: number
    startedAt: string
    submittedAt: string | null
    scorePoints: number | null
    scorePercent: string | null
    passed: boolean | null
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

/**
 * Lesson-level reaction + view summary
 * (`GET/PUT/DELETE /api/v1/courses/lessons/{lessonId}/reactions[/{reaction}]`).
 *
 * The first iteration only supports the `"LIKE"` reaction, so {@link myReaction} is
 * `"LIKE"` when the viewer has liked the lesson and `null` otherwise. `viewCount` is
 * the distinct-viewer counter kept on the lesson row; `likeCount` counts the reaction
 * rows.
 */
export interface LessonReactionSummaryView {
    lessonId: string
    viewCount: number
    likeCount: number
    /** `"LIKE"` when the viewer has liked this lesson, else `null`. */
    myReaction: string | null
}

/**
 * Một bài học viên đã học gần đây (`GET /courses/me/learned-lessons`, mới nhất trước).
 * Nguồn cho picker "chọn bài" của AI Hub — thay query GraphQL legacy `myLearnedLessons`
 * (BE chưa từng có field đó: gọi vào trả FieldUndefined nên picker luôn rỗng).
 */
export interface LearnedLessonView {
    lessonId: string
    title: string
    courseId: string
    /** Null khi khoá đã bị xoá. */
    courseTitle: string | null
    /** ISO-8601. */
    lastLearnedAt: string
}
