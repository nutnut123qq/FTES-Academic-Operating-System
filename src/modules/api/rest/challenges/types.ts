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
    /** Thời điểm mở (ISO-8601). `null` = mở ngay, không hẹn giờ. */
    startsAt: string | null
    /** Thời điểm đóng (ISO-8601). `null` = KHÔNG giới hạn (không bao giờ tự đóng). */
    endsAt: string | null
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

/**
 * One tag attached to a challenge (BE `challenge.tags` / `ChallengeTagView`). The `slug`
 * is the stable machine key the `tags=` query param filters on (e.g. `pe`, `prf192`); the
 * `label` is the human text rendered on the chip.
 */
export interface ChallengeTagView {
    /** Stable machine key, lower-kebab (e.g. `pe`, `prf192`). */
    slug: string
    /** Human label shown on the chip. */
    label: string
}

/**
 * Display card of one person on a challenge surface — the challenge's UPLOADER and any
 * comment author (BE `ChallengeViews.AuthorView`).
 *
 * The field names are deliberately the same four as the community
 * {@link import("../community").PostAuthor} / group `UserCard`, so the shared identity
 * components (`UserLink`, `UserAvatar`) read this straight with no second mapper.
 *
 * Resolved BE-side in ONE batched `profile.api` call per page, so a comment page never
 * costs a profile read per row. Every field but `userId` is nullable: the card comes from
 * a profile row that may not carry a display name or an avatar, and inventing one here
 * would print a placeholder the server never stored.
 */
export interface ChallengeAuthorView {
    /** The user's id (UUID) — always present when the card itself exists. */
    userId: string
    /** URL-facing handle, for the profile link + hovercard. */
    username?: string | null
    /** Preferred display name; falls back to the username at render time. */
    displayName?: string | null
    /** Uploaded avatar URL; absent → the shared avatar's generated tile. */
    avatarUrl?: string | null
}

/**
 * ONE file of a challenge's exam paper (BE `ChallengeViews.PaperFileView`, contract
 * `challenge-paper-multifile`).
 *
 * A real Practical Exam paper is several files with different jobs: a few page images or a
 * PDF the candidate READS, plus a `.zip`/`.docx`/`.xlsx` template they DOWNLOAD and fill
 * in. `challenge.paper_files` holds them as an ordered set, and this is one row of it.
 *
 * The four scalar `paper*` fields on {@link ChallengeView} did not go away — they describe
 * the PRIMARY file of this same set (the first {@link role} `VIEW` file by
 * {@link sortOrder}, or the first file when none is viewable), which is what keeps every
 * reader written before this contract working untouched.
 */
export interface ChallengePaperFileView {
    /** Row id (UUID) — stable React key and the id the manage endpoints address. */
    id: string
    /** Absolute, already-signed delivery URL of this file. */
    url: string
    /** Stored MIME type — normalised BE-side (a ZIP is always `application/zip`). */
    mime: string
    /** Original filename the author uploaded, shown in the attachments list. */
    filename: string
    /** Size on storage, in bytes — the size AFTER watermarking/optimisation. */
    sizeBytes: number
    /**
     * What this file is FOR, decided SERVER-SIDE from {@link mime} and never by the author:
     * `"VIEW"` (`image/*` + `application/pdf` — an exam page to render in place) or
     * `"DOWNLOAD"` (archive/document/spreadsheet — a template to download).
     *
     * Typed as a plain `string` rather than a union because the BE deliberately publishes
     * it as a string so a future role is not a breaking change. Readers must therefore
     * treat ONLY the exact value `"VIEW"` as permission to embed the file, and default
     * anything else — including a role they do not know — to download-only, which mirrors
     * the BE's own `PaperFileRole.of` fallback. Never re-derive this from the filename.
     */
    role: string
    /** The author's ordering, ascending and contiguous from 0 after every mutation. */
    sortOrder: number
}

/**
 * One comment on a challenge (BE `ChallengeCommentDtos.CommentView`).
 *
 * Threading is ONE level: roots carry `replies`, and a reply-of-reply is re-parented onto
 * the root by the BE — so this structure never nests deeper than shown here.
 *
 * A soft-deleted row keeps its id and its replies (the thread must not collapse under a
 * deleted parent) with `status: "DELETED"`, its `content` replaced by the BE tombstone
 * text, and BOTH `authorId` and `author` nulled — the server deliberately stops saying who
 * wrote it.
 *
 * There is **no like/reaction count**: the BE ships no reaction table for this thread
 * (V316 creates none), so any such field could only ever be a constant zero.
 */
export interface ChallengeCommentView {
    /** Comment id (UUID as a string). */
    id: string
    /** Author's user id; `null` on a tombstoned row. */
    authorId: string | null
    /**
     * The author's already-resolved display card; `null` on a tombstoned row, and also
     * when the author simply has no profile — the FE degrades, it never re-fetches.
     */
    author?: ChallengeAuthorView | null
    /** Root comment id when this is a reply; `null` on a root. */
    parentId: string | null
    /** Comment body, or the BE tombstone text once deleted. */
    content: string
    /** `VISIBLE` | `HIDDEN` | `DELETED`. */
    status: string
    /** Creation instant (ISO-8601). */
    createdAt: string
    /** One-level replies under a root, oldest-first (empty on a reply). */
    replies: Array<ChallengeCommentView>
}

/**
 * Paged challenge comments (`GET /api/v1/challenges/{id}/comments?page=&size=`).
 *
 * `page` is **1-based** — the BE shifts it onto its own 0-based `PageRequest`, so the
 * number is passed through verbatim (same contract as the resource/FE-image threads).
 * `total` counts ROOT comments only, which is what the pager pages over.
 */
export interface ChallengeCommentPage {
    items: Array<ChallengeCommentView>
    page: number
    size: number
    total: number
}

/** Body sent to `POST /api/v1/challenges/{id}/comments`. */
export interface PostChallengeCommentRequest {
    /** Parent comment id when replying; omit/null for a top-level comment. */
    parentId?: string | null
    /** Comment body — the BE caps it at 5000 characters. */
    content: string
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
    /** Thời điểm mở (ISO-8601). `null` = mở ngay, không hẹn giờ. */
    startsAt: string | null
    /** Thời điểm đóng (ISO-8601). `null` = KHÔNG giới hạn (không bao giờ tự đóng). */
    endsAt: string | null
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
    /**
     * How many submissions this challenge has received across all participants — the BE
     * popularity signal that drives the "Hot" sort on the practice bank. Additive — absent
     * on older deployments → treated as `0`.
     */
    submissionCount?: number
    /**
     * "Học thử" (free-trial) flag. When true the tight per-challenge project-grade cap
     * applies (cost protection for non-payers); when false (a paid challenge the learner
     * bought) the mentor's `maxSubmissions` is the sole submission cap. Additive — absent
     * on older deployments → treated as not-free (paid).
     */
    free?: boolean
    /**
     * Tags classifying the challenge (`pe` + the subject code for a folded-in Practical
     * Exam paper, contract challenge-global-bank-tags). Drives the tag chips + the tag
     * filter row, and mirrors the `tags=` list query param. Additive — absent on older
     * deployments → the surfaces render no tag chips.
     */
    tags?: Array<ChallengeTagView> | null
    /**
     * Direct URL of the challenge's EXAM PAPER file, when the challenge ships one (a PE
     * paper folded into the challenge bank). `null` / absent for an ordinary challenge.
     * The learner READS it — there is deliberately no submission surface behind it
     * (AI grading stays locked).
     */
    paperUrl?: string | null
    /**
     * MIME type of {@link paperUrl} (`image/*` → rendered inline, `application/pdf` →
     * embedded viewer, anything else → open/download affordance). `null` when the BE
     * could not resolve one — the FE then falls back to the URL's file extension.
     */
    paperMime?: string | null
    /**
     * The WHOLE exam paper — every attached file in the author's order, each carrying its
     * own filename, size and server-derived {@link ChallengePaperFileView.role} (BE
     * `challenge-paper-multifile` §3.5).
     *
     * {@link paperUrl} / {@link paperMime} above stay the PRIMARY file of this same set, so
     * this field is purely additive: absent on deployments older than the contract, and
     * deliberately EMPTY on the list and mutation paths (a card only needs the primary
     * file; reading the set per row would be an N+1 on the hottest path). Only the detail
     * read (`GET /api/v1/challenges/{slug}`) populates it.
     *
     * Absent / empty → the reader MUST fall back to the single-file fields and behave
     * exactly as it did before, which is what keeps an older deployment intact.
     */
    paperFiles?: Array<ChallengePaperFileView> | null
    /**
     * Whether the CALLER may approve/reject this contributed challenge (BE
     * `challenge-paper-review` §3). The BE computes it per-challenge because approval rights
     * are granted PER SUBJECT and never appear in the JWT authorities — so the FE must gate
     * any review affordance on this flag and must NEVER infer it from the caller's global
     * permission list. Additive — absent on older deployments → treated as `false`.
     */
    canApprove?: boolean
    /**
     * Wall-clock budget ONE submission must fit, in milliseconds — the LARGEST `timeLimitMs`
     * across the challenge's test cases (BE `challenge-testcase-samples`). Shown to the
     * learner beside the problem statement, HackerRank-style, because it decides which
     * algorithm is viable. `null` when the challenge has no test cases; absent on
     * deployments older than the contract → the FE renders no limit line either way.
     */
    timeLimitMs?: number | null
    /**
     * Memory budget ONE submission must fit, in megabytes — the LARGEST `memoryLimitMb`
     * across the challenge's test cases (BE `challenge-testcase-samples`). Same nullability
     * rule as {@link timeLimitMs}.
     */
    memoryLimitMb?: number | null
    /**
     * How many AI-feedback attempts this learner gets on this challenge — the mentor's
     * configured value (default 1, clamped 1..5, kept in `grading_config`). On a test-case
     * graded challenge the AI only COMMENTS: the score always comes from the test cases, so
     * exhausting the allowance never blocks submitting. `null` / absent on deployments older
     * than `challenge-testcase-samples` → the FE shows no allowance at all.
     */
    aiFeedbackLimit?: number | null
    /**
     * How many of {@link aiFeedbackLimit} this learner has already spent — counted BE-side
     * from stored grading results (`submission_results kind=AI`), not from an expiring
     * cache. `null` / absent → unknown, treated as none used.
     */
    aiFeedbackUsed?: number | null
    /**
     * Display card of whoever UPLOADED this challenge — the BE's `created_by` resolved
     * through `profile.api` (contract challenge-paper-comments §1). A PE paper surface has
     * to be able to say who put the paper up.
     *
     * `null` / absent when the challenge has no `created_by`, when that user has no
     * profile, or on a deployment older than the contract. Every reader must therefore
     * DEGRADE — hide the uploader line — and never print a placeholder identity.
     */
    author?: ChallengeAuthorView | null
    /**
     * When the challenge (and therefore its paper) was PUT UP — ISO-8601, read next to
     * {@link author} as "Uploaded by … / 20 hours ago", the way the FE album labels a
     * picture with `FeImage.createdAt`.
     *
     * **The BE does not send this field yet.** `challenge.challenges.created_at` exists in
     * the schema and `ChallengeEntity.createdAt` maps it, but
     * `ChallengeViews.ChallengeView` never projects it — so this is `undefined` on every
     * deployment today and the uploader block simply prints no time. It is declared here
     * (rather than left out) because it is the ONE place the value has to land, and the
     * only alternatives would be lies: `startsAt` is when the challenge OPENS, not when it
     * was posted, and a client-side `Date.now()` is a fabricated timestamp. Adding
     * `Instant createdAt` to the BE record lights this up with no further FE change.
     */
    createdAt?: string | null
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

/**
 * The judge verdict of ONE executed test case (BE `challenge-testcase-judge` design §6 —
 * persisted on `submission_results.detail`):
 * - `AC` — accepted (output matches)
 * - `WA` — ran to completion, wrong output
 * - `TLE` — time limit exceeded
 * - `MLE` — memory limit exceeded
 * - `RE` — runtime error (non-zero exit)
 * - `CE` — compile error
 * - `SKIPPED` — never executed because the run stopped early (budget / too many timeouts)
 */
export type TestCaseVerdict = "AC" | "WA" | "TLE" | "MLE" | "RE" | "CE" | "SKIPPED"

/**
 * Result row for one test case. The BE deliberately exposes NO `input` / `expectedOutput` /
 * captured `stdout` here — hidden cases stay hidden (`SubmissionService.resultsFor()`), so the
 * learner view is limited to name + verdict + timing + score.
 */
export interface TestResultView {
    /** Test case id. */
    testCaseId: string
    /**
     * Tên test case. **Có thể null**: sửa/import lại bộ test là xoá-rồi-chèn với id MỚI, mà
     * `submission_results.test_case_id` không có FK ⇒ kết quả của bài nộp cũ thành mồ côi và BE
     * không tra ra tên. Luôn phòng null khi render.
     */
    testCaseName: string | null
    /** Whether this is a hidden test case. */
    hidden: boolean
    /** Whether the submission passed this test; nullable while grading. */
    passed: boolean | null
    /** Score awarded for this test case. */
    score: string
    /**
     * The judge verdict for this case ({@link TestCaseVerdict}) — what distinguishes a wrong
     * answer from a timeout / memory blow-up / compile error. `null` while the case is still
     * being graded; additive — absent on deployments older than `challenge-testcase-judge`.
     */
    verdict?: TestCaseVerdict | null
    /** Wall-clock execution time in milliseconds; `null` while grading / when unmeasured. */
    timeMs?: number | null
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
