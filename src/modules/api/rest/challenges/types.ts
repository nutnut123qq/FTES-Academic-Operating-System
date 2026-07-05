/**
 * Request / response shapes for the `/api/v1/challenges` REST endpoints.
 *
 * Inferred from backend `vn.ftes.aos.challenge.web.dto.ChallengeViews` and
 * `ChallengeController`.
 */

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
    /** Challenge type. */
    type: string
    /** Competition mode. */
    mode: string
    /** Subject id. */
    subjectId: string
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
    /** Payload discriminator, e.g. `CODE`, `STORAGE`, `URL`. */
    payloadType: string
    /** Source code when payload type is `CODE`. */
    code: string
    /** Programming language identifier. */
    language: string
    /** Storage object key when payload type is `STORAGE`. */
    storageKey: string
    /** External URL when payload type is `URL`. */
    url: string
}

/** Submission summary returned on submit / list. */
export interface SubmissionView {
    /** Submission id (UUID). */
    id: string
    /** Attempt number. */
    attemptNo: number
    /** Submission status, e.g. `PENDING`, `GRADING`, `COMPLETED`. */
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
    /** Submission status. */
    status: string
    /** Final score. */
    finalScore: string
    /** Per-test-case results. */
    results: Array<TestResultView>
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
