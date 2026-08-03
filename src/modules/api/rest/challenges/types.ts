/**
 * Request / response shapes for the `/api/v1/challenges` REST endpoints.
 *
 * Inferred from backend `vn.ftes.aos.challenge.web.dto.ChallengeViews` and
 * `ChallengeController`.
 */

import type { CodeGradeResult } from "../ai"

/** Body sent to `POST /api/v1/challenges`. */
export interface CreateChallengeRequest {
    /** Challenge title. */
    title: string
    /** URL-friendly unique identifier. */
    slug: string
    /** Full description (markdown). */
    description: string
    /** Challenge type, e.g. `CODING`, `SQL`, `UI_UX`, `AI`, `BUSINESS`. */
    type: string
    /** Competition mode: `INDIVIDUAL` or `TEAM`. */
    mode: string
    /** Subject this challenge belongs to. */
    subjectId: string
    /** Challenge start time (ISO-8601). */
    startsAt: string
    /** Challenge end time (ISO-8601). */
    endsAt: string
    /** Maximum submissions per participant/team. */
    maxSubmissions: number
    /** Maximum team members when mode is `TEAM`; nullable. */
    maxTeamSize: number | null
    /** Opaque JSON scoring configuration. */
    scoringConfig: string
    /** Opaque JSON reward configuration. */
    rewardConfig: string
}

/**
 * One learner-visible SAMPLE test case on a `CODE` challenge view. The BE exposes ONLY the
 * NON-HIDDEN (`is_hidden=false`) cases here — HIDDEN cases are never sent to the learner
 * (they stay server-side for AI grading). Additive — absent on older deployments.
 */
export interface SampleTestCaseView {
    /** Optional display name for the case. */
    name?: string
    /** Input fed to the program (stdin / args, per the exercise contract). */
    input: string
    /** Expected output the program should produce. */
    expected: string
}

/** One selectable option of an MCQ question (taker-safe — no `correctKeys`). */
export interface OptionItem {
    /** Stable option key, e.g. `"A"`. */
    key: string
    /** Option text shown to the learner. */
    text: string
}

/**
 * A taker-safe MCQ question on a `MULTIPLE_CHOICE` challenge (BE `McqQuestionView`).
 * Correct keys are NOT exposed to the taker — grading happens server-side.
 */
export interface McqQuestionView {
    /** Question id (UUID). */
    id: string
    /** Question prompt. */
    question: string
    /** Selectable options. */
    options: Array<OptionItem>
    /** Points awarded for this question. */
    points: number
    /** Display order. */
    orderNo: number
}

/** Challenge summary returned by list/detail endpoints. */
export interface ChallengeView {
    /** Challenge id (UUID). */
    id: string
    /** Challenge title. */
    title: string
    /** URL-friendly unique identifier. */
    slug: string
    /** Full description. */
    description: string
    /** Challenge type, e.g. `MULTIPLE_CHOICE`, `CODE`, `ESSAY`. */
    type: string
    /** Competition mode. */
    mode: string
    /** Subject id. */
    subjectId: string
    /** Linked lesson id, when the challenge is attached to a lesson. */
    lessonId?: string | null
    /** Lifecycle status, e.g. `DRAFT`, `PUBLISHED`, `RUNNING`, `CLOSED`. */
    status: string
    /** Start time (ISO-8601). */
    startsAt: string
    /** End time (ISO-8601). */
    endsAt: string
    /** Maximum submissions. */
    maxSubmissions: number
    /** Maximum team size; nullable. */
    maxTeamSize: number | null
    /** Opaque JSON grading configuration (present on detail). */
    gradingConfig?: string | null
    /** Taker-safe MCQ questions (present when `type` is `MULTIPLE_CHOICE`). */
    mcqQuestions?: Array<McqQuestionView> | null
    /**
     * Owning course id when the challenge is course-bank scoped
     * (BE `course-challenge-bank`); optional so old BEs don't break.
     */
    courseId?: string | null
    /** Visibility: `COURSE_ONLY` | `WORKSPACE_PUBLIC` (course-challenge-bank). */
    visibility?: string | null
    /**
     * Which submission method(s) a `CODE` challenge accepts (contract
     * challenge-submission-method-solver): `"GITHUB"` (repo URL only) | `"FILE"` (upload
     * a code/zip file, AI-graded) | `"BOTH"`. Additive — absent on older deployments →
     * the code solver keeps the inline `GradeCodePanel` editor and never offers a
     * github/file surface the BE cannot accept yet.
     */
    submissionMethod?: string | null
    /**
     * The SQL seed dataset the learner queries against, when the challenge ships one
     * (BE reads it from `grading_config`). VISIBLE to the learner — it is the dataset
     * to query, NOT an answer key (`expectedOutput` / `testCases` stay manager-gated).
     * Threaded into the sandbox SQL Run path as `setup_sql`. Additive — absent on
     * older deployments / non-SQL challenges.
     */
    seedSql?: string | null
    /**
     * The author's file-extension hint for a code exercise (e.g. `".py"`, `".sql"`),
     * read from `grading_config`. Drives the FE language map and whether the in-browser
     * sandbox ("Code trực tiếp") is offered. Additive — absent on older deployments.
     */
    fileExtension?: string | null
    /**
     * The learner-visible SAMPLE (non-hidden) test cases of a `CODE` challenge, each
     * `{name?, input, expected}`. The BE exposes ONLY `is_hidden=false` cases here —
     * HIDDEN cases are never sent to the learner (they stay server-side for AI grading).
     * Drives the sandbox "Chạy test" action + the read-only "Ví dụ" examples. Additive —
     * absent on older deployments / non-code challenges.
     */
    sampleTestCases?: Array<SampleTestCaseView> | null
}

/** Wrapper for a batch test-case upsert. */
export interface TestCaseUpsert {
    /** Ordered test cases to replace the existing set. */
    testCases: Array<TestCaseItem>
}

/** Single test case item. */
export interface TestCaseItem {
    /** Display name. */
    name: string
    /** Input data for the test. */
    input: string
    /** Expected output. */
    expectedOutput: string
    /** Weight used when computing the score. */
    weight: string
    /** Whether the test case input/output should be hidden from participants. */
    hidden: boolean
    /** Time limit in milliseconds. */
    timeLimitMs: number
    /** Memory limit in megabytes. */
    memoryLimitMb: number
    /** Display order. */
    orderNo: number
}

/** Wrapper for a batch rubric upsert. */
export interface RubricUpsert {
    /** Rubric criteria to replace the existing set. */
    rubrics: Array<RubricItem>
}

/** Single rubric criterion. */
export interface RubricItem {
    /** Short criterion name. */
    criterion: string
    /** Criterion description. */
    description: string
    /** Maximum score for this criterion. */
    maxScore: string
    /** Display order. */
    orderNo: number
}

/** Body sent to `POST /api/v1/challenges/{id}/teams`. */
export interface CreateTeamRequest {
    /** Team name. */
    name: string
    /** Optional group to bind the team to. */
    groupId: string | null
}

/** Team summary returned on creation. */
export interface TeamView {
    /** Team id (UUID). */
    id: string
    /** Team name. */
    name: string
    /** User id of the team leader. */
    leaderUserId: string
}

/** Body sent to `POST /api/v1/challenges/{id}/submissions`. */
export interface SubmitRequest {
    /** Payload discriminator, e.g. `MCQ`, `CODE`, `ESSAY`, `STORAGE`, `URL`. */
    payloadType: string
    /** Source code when payload type is `CODE`. */
    code?: string
    /** Programming language identifier. */
    language?: string
    /** Storage object key when payload type is `STORAGE`. */
    storageKey?: string
    /** External URL when payload type is `URL`. */
    url?: string
    /**
     * Selected option keys per MCQ question (`{ questionId: ["A", ...] }`) when
     * payload type is `MCQ`. Mirrors BE `Map<String, List<String>> answers`.
     */
    answers?: Record<string, Array<string>>
    /** Essay body when payload type is `ESSAY`. */
    essayText?: string
    /**
     * Optional AI grading model id (from the catalog `GET /api/v1/ai/models`) for a
     * `CODE` / `URL` submission. The BE persists it (`challenge.submissions.grading_model`)
     * and forwards it to the AI grader; it does NOT validate the allowlist (ai-service
     * enforces). Omit → the BE grades with its configured default.
     */
    model?: string
}

/** Submission summary returned on submit / list. */
export interface SubmissionView {
    /** Submission id (UUID). */
    id: string
    /** Attempt number. */
    attemptNo: number
    /**
     * The payload discriminator this attempt was submitted as (`MCQ` | `CODE` | `ESSAY` |
     * `STORAGE` | `FILE` | `URL`). The FE counts the heavy PROJECT grades — `FILE` (zip
     * upload) and `URL` (github repo), both routed to the agentic `/grade-project` — to
     * enforce the per-learner `PROJECT_GRADE_LIMIT` cap near the submit surface. Additive —
     * absent on older deployments (the FE then treats it as no project grade used yet).
     */
    payloadType?: string
    /**
     * Submission status, FE-normalized (PINNED §3): the challenges REST layer maps the BE
     * `SCORED → COMPLETED` and `RUNNING → GRADING`, so this is always one of
     * `PENDING` | `GRADING` | `COMPLETED` | `FAILED` (`QUEUED` may also appear pre-grade).
     * `GRADING` keeps the attempts list polling; `COMPLETED` shows "Đã chấm" + the score.
     */
    status: string
    /** Auto-graded score. */
    autoScore: string | null
    /** Manually assigned score. */
    manualScore: string | null
    /** Final computed score. */
    finalScore: string | null
    /** Submission timestamp (ISO-8601). */
    submittedAt: string
}

/** Single manual score entry. */
export interface ManualScoreItem {
    /** Rubric id being scored. */
    rubricId: string
    /** Score assigned. */
    score: string
    /** Optional grader comment. */
    comment: string
}

/** Result row for one test case. */
export interface TestResultView {
    /** Test case id. */
    testCaseId: string
    /** Test case name. */
    testCaseName: string
    /** Whether this is a hidden test case. */
    hidden: boolean
    /** Whether the submission passed this test; nullable while grading. */
    passed: boolean | null
    /** Score awarded for this test case. */
    score: string
}

/** Full test results for a submission. */
export interface SubmissionResultsView {
    /** Submission id. */
    submissionId: string
    /** Attempt number. */
    attemptNo: number
    /** Submission status (FE-normalized — see {@link SubmissionView.status}). */
    status: string
    /** Final score. */
    finalScore: string
    /** Per-test-case results. */
    results: Array<TestResultView>
    /**
     * The AI grader's verdict for a code/URL/file submission (BE `aiFeedback`) — score /
     * verdict / per-criterion breakdown / feedback, the SAME shape the in-panel
     * `GradeResultCard` renders. Present once the submission is graded (`COMPLETED`);
     * `null` / absent while pending or for a non-AI-graded type. Lets the attempts list
     * re-open a graded submission's feedback without re-submitting.
     */
    aiFeedback?: CodeGradeResult | null
}

/**
 * One node of a graded project submission's file tree (PIN §3C —
 * `GET /api/v1/challenges/{id}/submissions/{sid}/project/tree`). The BE downloads the
 * submission's uploaded `.zip` server-side, unzips it in-memory (guarded), and returns
 * the whitelisted code files as `{path, size}` — `path` is project-relative (POSIX
 * separators), `size` is the file's byte length. Ownership-gated (submission owner /
 * `canManage`), so the FE never touches Cloudinary directly.
 */
export interface ProjectTreeEntry {
    /** Project-relative path (POSIX `/` separators), e.g. `src/app.py`. */
    path: string
    /** File size in bytes. */
    size: number
}

/**
 * The content of ONE file of a graded project submission (PIN §3C —
 * `GET /api/v1/challenges/{id}/submissions/{sid}/project/file?path=`). The BE re-reads
 * the file from the submission's zip server-side (path-traversal guard, whitelist, size
 * cap) and returns its UTF-8 text. Ownership-gated like {@link ProjectTreeEntry}.
 */
export interface ProjectFileView {
    /** The project-relative path echoed back (matches the requested `path`). */
    path: string
    /** The file's UTF-8 text content. */
    content: string
}

/** Leaderboard entry row. */
export interface LeaderboardEntry {
    /** Participant type: `USER` or `TEAM`. */
    participantType: string
    /** Participant id (UUID). */
    participantId: string
    /** Best score. */
    score: number
    /** Rank (1-based). */
    rank: number
}

/** Leaderboard payload including optional current-user rank. */
export interface LeaderboardView {
    /** Top ranked entries. */
    entries: Array<LeaderboardEntry>
    /** Current user's rank when authenticated; nullable. */
    myRank: number | null
}
