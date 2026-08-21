/**
 * Request / response shapes for the subject REST controller cluster.
 *
 * Inferred from backend `vn.ftes.aos.subject.web.dto.SubjectDtos`,
 * `vn.ftes.aos.subject.web.dto.WorkspaceDtos`, and the four controllers:
 * SubjectCatalog, Workspace, Membership, Statistics.
 */

// ---------------------------------------------------------------- catalog

/**
 * Một chuẩn đầu ra của môn. BE lưu `learning_outcomes` là mảng OBJECT
 * (`vn.ftes.aos.subject.domain.LearningOutcome` = `{code, description}`), KHÔNG phải mảng
 * chuỗi — kiểu ở đây từng khai `Array<string>`, và ghi chuỗi trần xuống cột đó làm Jackson
 * ném `MismatchedInputException` khiến MỌI endpoint đọc môn trả 500.
 */
export interface LearningOutcomeView {
    /** Nhãn ngắn, thường là `LO1`, `LO2`… */
    code: string
    /** Nội dung chuẩn đầu ra. */
    description: string
}

/** Body sent to `POST /api/v1/subjects`. */
export interface CreateSubjectRequest {
    code: string
    name: string
    nameVi?: string | null
    description?: string | null
    credits: number
    recommendedSemester?: number | null
    difficulty: string
    learningOutcomes?: Array<LearningOutcomeView> | null
    roadmap?: Array<string> | null
    thumbnailUrl?: string | null
}

/** Body sent to `PATCH /api/v1/subjects/{code}`. */
export interface UpdateSubjectRequest {
    name?: string | null
    nameVi?: string | null
    description?: string | null
    credits?: number | null
    recommendedSemester?: number | null
    difficulty?: string | null
    learningOutcomes?: Array<LearningOutcomeView> | null
    roadmap?: Array<string> | null
    thumbnailUrl?: string | null
}

/** Single prerequisite item in a replace request. */
export interface PrerequisiteItem {
    subjectId: string
    kind: string
}

/** Body sent to `PUT /api/v1/subjects/{code}/prerequisites`. */
export interface ReplacePrerequisitesRequest {
    prerequisites: Array<PrerequisiteItem>
}

/** Prerequisite returned by the replace endpoint. */
export interface PrerequisiteView {
    subjectId: string
    code: string
    name: string
    kind: string
}

/** Single related-subject item in a replace request. */
export interface RelatedItem {
    relatedId: string
    relation: string
}

/** Body sent to `PUT /api/v1/subjects/{code}/related`. */
export interface ReplaceRelatedRequest {
    related: Array<RelatedItem>
}

/** Related subject returned by the replace endpoint. */
export interface RelatedView {
    relatedId: string
    code: string
    name: string
    relation: string
}

/** Lecturer attached to a subject. */
export interface LecturerView {
    userId: string
    joinedAt: string
}

/** Full subject detail. */
export interface SubjectDetail {
    id: string
    code: string
    name: string
    nameVi: string
    description: string
    credits: number
    recommendedSemester: number | null
    difficulty: string
    learningOutcomes: Array<LearningOutcomeView>
    roadmap: Array<string>
    thumbnailUrl: string
    /**
     * Cover/identity image URL (CONTRACT A), or null when the subject has no artwork.
     * Additive on the BE detail + workspace read; falls back to {@link thumbnailUrl}
     * on deployments that predate the field.
     */
    imageUrl?: string | null
    status: string
    prerequisites: Array<PrerequisiteView>
    related: Array<RelatedView>
    lecturers: Array<LecturerView>
    /** Ngành của môn (BE V335) — xem {@link SubjectSummary.majors}. */
    majors?: Array<MajorView>
    createdAt: string
    updatedAt: string
}

/**
 * Một NGÀNH HỌC trong danh mục (BE V335, `GET /api/v1/majors`).
 *
 * `code` là thứ đi qua API và lưu trên hồ sơ (`academic.majorCode`); hai tên dùng để hiển thị
 * theo locale đang bật.
 */
export interface MajorView {
    id: string
    code: string
    name: string
    nameVi: string
    description?: string | null
    /**
     * Mã khối ngành cha; `null`/vắng mặt = khối cấp 1 HOẶC endpoint không dựng cây (chip ngành
     * đi kèm thẻ môn không mang trường này — chỉ `GET /majors` mới điền).
     */
    parentCode?: string | null
}

/** Subject summary row in catalog list. */
export interface SubjectSummary {
    id: string
    code: string
    name: string
    nameVi: string
    /**
     * Mô tả ngắn của môn. Optional vì BE mới thêm vào DTO danh sách (f0819bb3) — bản
     * apitest chưa deploy sẽ không có trường này, thẻ khi đó tự ẩn dòng mô tả.
     */
    description?: string | null
    credits: number
    recommendedSemester: number | null
    difficulty: string
    thumbnailUrl: string
    /** Cover/identity image URL (CONTRACT A); falls back to {@link thumbnailUrl}. */
    imageUrl?: string | null
    status: string
    /**
     * Ngành mà môn thuộc về (BE V335). Optional: bản BE chưa deploy V335 không trả trường này —
     * thẻ khi đó ẩn chip ngành, và bộ lọc ngành coi môn như "chưa gắn ngành" thay vì vỡ.
     */
    majors?: Array<MajorView>
}

/** Generic paginated response returned by backend list endpoints. */
export interface PageResponse<T> {
    items: Array<T>
    page: number
    size: number
    totalElements: number
    totalPages: number
}

// ---------------------------------------------------------------- membership

/** Body sent to `PUT /api/v1/subjects/{code}/members/{userId}/role`. */
export interface ChangeRoleRequest {
    role: string
}

/** Member row in paginated member list. */
export interface MemberView {
    userId: string
    role: string
    joinedAt: string
    username?: string | null
    displayName?: string | null
    avatarUrl?: string | null
}

/** My membership row. */
export interface MyMembershipView {
    subjectId: string
    code: string
    name: string
    role: string
    joinedAt: string
}

/** Response from `POST /api/v1/subjects/{code}/join`. */
export interface JoinResponse {
    membershipId: string
    role: string
}

/** Caller membership embedded in workspace. */
export interface CallerMembership {
    role: string
    joinedAt: string
}

// ---------------------------------------------------------------- links

/** Body sent to `POST /api/v1/subjects/{code}/links`. */
export interface CreateLinkRequest {
    tab: string
    targetType: string
    targetId: string
    titleOverride?: string | null
    sortOrder?: number | null
    pinned?: boolean | null
}

/** Body sent to `PATCH /api/v1/subjects/{code}/links/{id}`. */
export interface UpdateLinkRequest {
    titleOverride?: string | null
    sortOrder?: number | null
    pinned?: boolean | null
}

/** Curated link returned by workspace endpoints. */
export interface LinkView {
    id: string
    tab: string
    targetType: string
    targetId: string
    title: string
    sortOrder: number
    pinned: boolean
}

// ---------------------------------------------------------------- workspace

/** Generic tab envelope used by the workspace aggregate. */
export interface TabEnvelope<T> {
    available: boolean
    data: T | null
}

/** Link item inside workspace tabs. */
export interface LinkItem {
    id: string
    targetType: string
    targetId: string
    title: string
    pinned: boolean
    sortOrder: number
}

/** Learning tab payload. */
export interface LearningTab {
    links: Array<LinkItem>
}

/** Resources tab payload. */
export interface ResourcesTab {
    categoryCounts: Record<string, number>
    links: Array<LinkItem>
}

/** Community tab payload. */
export interface CommunityTab {
    feedRef: string
    endpoint: string
}

/** Practice tab payload. */
export interface PracticeTab {
    links: Array<LinkItem>
    leaderboardRef: string
}

/** AI tab payload. */
export interface AiTab {
    scopeRef: string
    links: Array<LinkItem>
}

/** Members tab payload. */
export interface MembersTab {
    countsByRole: Record<string, number>
    totalActive: number
}

/** Statistics tab payload (reference only). */
export interface StatisticsRef {
    statsRef: string
}

/** Career bridge tab payload. */
export interface CareerBridgeTab {
    relatedSkills: Array<string>
    relatedCareers: Array<string>
    suggestedRoadmap: string
    nextSubjects: Array<RelatedView>
    links: Array<LinkItem>
}

/** Full workspace aggregate. */
export interface WorkspaceView {
    overview: SubjectDetail
    learning: TabEnvelope<LearningTab>
    resources: TabEnvelope<ResourcesTab>
    community: TabEnvelope<CommunityTab>
    practice: TabEnvelope<PracticeTab>
    ai: TabEnvelope<AiTab>
    members: TabEnvelope<MembersTab>
    statistics: TabEnvelope<StatisticsRef>
    careerBridge: TabEnvelope<CareerBridgeTab>
    callerMembership: CallerMembership
}

// ---------------------------------------------------------------- statistics

/** Single leaderboard entry inside subject statistics. */
export interface SubjectLeaderboardEntry {
    userId: string
    score: number
    rank: number
}

/** Top student row. */
export interface TopStudentView {
    userId: string
    xp: number
    rank: number
}

/** Top contributor row. */
export interface TopContributorView {
    userId: string
    contributions: number
}

/** Popular resource row. */
export interface PopularResourceView {
    resourceId: string
    views: number
    downloads: number
}

/** Subject statistics payload. */
export interface StatisticsView {
    topStudents: Array<TopStudentView>
    topContributors: Array<TopContributorView>
    popularResources: Array<PopularResourceView>
    /**
     * Completion rate as a percent (0..100, 2dp) computed from the linked courses.
     * `null` until the worker computes a snapshot, or when no linked course has
     * enrollments — a missing rate is NOT zero.
     */
    completionRate: number | null
    memberCount: number
    postCount: number
    resourceCount: number
    leaderboard: Array<SubjectLeaderboardEntry>
    /** Timestamp of the last worker recompute; `null` before the first run. */
    computedAt: string | null
}

// ---------------------------------------------------------------- practice: quiz (V266/V267)

/** One selectable option of a practice question. */
export interface PracticeOptionView {
    key: string
    text: string
}

/**
 * A question as SERVED — deliberately without `correctKeys`/`explanation`; those
 * only appear in the submit result.
 */
export interface PracticeQuestionView {
    id: string
    question: string
    /** `SINGLE_CHOICE` | `MULTIPLE_CHOICE` | `TRUE_FALSE` (question-bank type). */
    type: string
    options: Array<PracticeOptionView>
    points: number
    difficulty: string
}

/**
 * A drawn practice quiz. `count` is how many questions actually came back — it can be
 * smaller than the requested `count` when the bank is thin, and `0` (with
 * `questions: []`) when the subject has no ready questions at all → empty state.
 */
export interface PracticeQuizView {
    subjectCode: string
    count: number
    questions: Array<PracticeQuestionView>
}

/** One submitted answer; an empty/omitted `selectedKeys` means the question was skipped. */
export interface PracticeAnswerInput {
    questionId: string
    selectedKeys?: Array<string>
}

/** Body sent to `POST /api/v1/subjects/{code}/practice/quiz/submit` (1..50 answers). */
export interface SubmitPracticeQuizRequest {
    answers: Array<PracticeAnswerInput>
}

/** Per-question outcome — the only place `correctKeys` / `explanation` are exposed. */
export interface PracticeQuestionResultView {
    questionId: string
    question: string
    type: string
    options: Array<PracticeOptionView>
    selectedKeys: Array<string>
    correctKeys: Array<string>
    correct: boolean
    points: number
    earnedPoints: number
    explanation?: string | null
}

/**
 * Practice attempt summary — graded server-side and NOT recorded in the transcript
 * (no attempt row), so a learner can retake freely. `scorePercent` arrives as a
 * decimal string/number from the BE `BigDecimal`.
 */
export interface PracticeQuizResultView {
    subjectCode: string
    totalQuestions: number
    answeredQuestions: number
    correctCount: number
    earnedPoints: number
    totalPoints: number
    scorePercent: number | string
    results: Array<PracticeQuestionResultView>
}

// ---------------------------------------------------------------- practice: flashcards (SM-2)

/**
 * The CALLER's SM-2 state on one card. `status`: `NEW` (never reviewed) | `LEARNING`
 * (relearning) | `REVIEWING`. `due: true` → show the "đến hạn" badge; a never-reviewed
 * card is always due so it enters the first session.
 */
export interface FlashcardProgressView {
    status: string
    /** SM-2 ease factor (BigDecimal, e.g. `2.50`). */
    ease: number | string
    intervalDays: number
    repetitions: number
    lapses: number
    dueAt?: string | null
    lastReviewedAt?: string | null
    lastGrade?: number | null
    due: boolean
}

/** A card plus the caller's progress (anonymous → a fresh `NEW` progress). */
export interface FlashcardCardView {
    id: string
    front: string
    back: string
    sortOrder: number
    progress: FlashcardProgressView
}

/** A deck with ALL its cards and due counters — enough to run a session without extra calls. */
export interface FlashcardDeckView {
    id: string
    subjectCode: string
    title: string
    description?: string | null
    /** `PUBLIC` | `MEMBERS`. */
    visibility: string
    /** `DRAFT` | `PUBLISHED` | `ARCHIVED`. */
    status: string
    /**
     * TOTAL number of cards in the deck — NOT `cards.length`. When `locked` is true the BE
     * ships only the free-preview slice, so counting the array understates the deck and the
     * upsell would advertise less than the deck actually holds.
     */
    cardCount: number
    dueCount: number
    newCount: number
    createdAt?: string | null
    updatedAt?: string | null
    /** `FREE` | `PREMIUM` — the PAID tier, orthogonal to `visibility` (subject membership). */
    accessTier: string
    /** `cards` has been trimmed to `previewLimit`; the rest needs a membership. */
    locked: boolean
    /** How many cards a non-member may study. */
    previewLimit: number
    cards: Array<FlashcardCardView>
}

/**
 * Every deck of a subject plus subject-level totals. `canManage` mirrors the BE curate
 * check (subject manager / curator / lecturer-moderator-contributor of THIS subject) —
 * gate the deck/card CRUD affordances on it instead of guessing from roles.
 */
export interface FlashcardDecksView {
    subjectCode: string
    deckCount: number
    totalCards: number
    dueCount: number
    canManage: boolean
    /**
     * Whether the viewer may study the paid decks in full. Read THIS to decide whether to
     * show the membership upsell — do not infer it from `decks.some(d => d.locked)`, which
     * is false for a subject whose paid decks are all shorter than the preview limit.
     */
    hasFullAccess: boolean
    decks: Array<FlashcardDeckView>
}

/** A card supplied when creating a deck or appending to one. */
export interface FlashcardCardInput {
    front: string
    back: string
    sortOrder?: number | null
}

/**
 * Body for `POST /api/v1/subjects/{code}/practice/flashcards/decks`. `cards` is optional
 * — a deck and up to 500 cards can be imported in ONE request. Defaults:
 * `visibility = PUBLIC`, `status = PUBLISHED`.
 */
export interface CreateFlashcardDeckRequest {
    title: string
    description?: string | null
    visibility?: string | null
    status?: string | null
    cards?: Array<FlashcardCardInput>
}

/** PATCH deck — an omitted/null field keeps its current value. */
export interface UpdateFlashcardDeckRequest {
    title?: string | null
    description?: string | null
    visibility?: string | null
    status?: string | null
}

/** Body for appending 1..500 cards to a deck. */
export interface AddFlashcardCardsRequest {
    cards: Array<FlashcardCardInput>
}

/** PATCH card — an omitted/null field keeps its current value. */
export interface UpdateFlashcardCardRequest {
    front?: string | null
    back?: string | null
    sortOrder?: number | null
}

/** Self-grade after flipping a card, SM-2 scale 0..5 (`< 3` = forgotten). */
export interface ReviewFlashcardRequest {
    grade: number
}

/**
 * Outcome of one review: the card's new SM-2 state plus how many cards are STILL due in
 * that deck, so the badge updates without re-fetching the deck.
 */
export interface ReviewFlashcardResultView {
    cardId: string
    deckId: string
    progress: FlashcardProgressView
    deckDueCount: number
}
