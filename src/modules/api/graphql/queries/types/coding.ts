import type { GraphQLResponse } from "../../types"

/** Difficulty tier of a coding problem (mirrors backend `CodingDifficulty`). */
export enum CodingDifficulty {
    Easy = "easy",
    Medium = "medium",
    Hard = "hard",
}

/** Primary interview topic domain of a coding problem (mirrors backend `CodingDomain`). */
export enum CodingDomain {
    Arrays = "arrays",
    Strings = "strings",
    Hashing = "hashing",
    TwoPointers = "twoPointers",
    SlidingWindow = "slidingWindow",
    Stack = "stack",
    Queue = "queue",
    LinkedList = "linkedList",
    Trees = "trees",
    Heap = "heap",
    Graph = "graph",
    BinarySearch = "binarySearch",
    Sorting = "sorting",
    Recursion = "recursion",
    Backtracking = "backtracking",
    DynamicProgramming = "dynamicProgramming",
    Greedy = "greedy",
    Math = "math",
    BitManipulation = "bitManipulation",
    Matrix = "matrix",
}

/** Stable display order for domain sections in the practice list. */
export const CODING_DOMAIN_ORDER: Array<CodingDomain> = [
    CodingDomain.Arrays,
    CodingDomain.Strings,
    CodingDomain.Hashing,
    CodingDomain.TwoPointers,
    CodingDomain.SlidingWindow,
    CodingDomain.Stack,
    CodingDomain.Queue,
    CodingDomain.LinkedList,
    CodingDomain.Trees,
    CodingDomain.Heap,
    CodingDomain.Graph,
    CodingDomain.BinarySearch,
    CodingDomain.Sorting,
    CodingDomain.Recursion,
    CodingDomain.Backtracking,
    CodingDomain.DynamicProgramming,
    CodingDomain.Greedy,
    CodingDomain.Math,
    CodingDomain.BitManipulation,
    CodingDomain.Matrix,
]

/** Submission language (mirrors backend `CodingLanguage`). */
export enum CodingLanguage {
    Python = "python",
    JavaScript = "javascript",
    TypeScript = "typescript",
    Java = "java",
    Cpp = "cpp",
}

/** Judging verdict (mirrors backend `CodingVerdict`). */
export enum CodingVerdict {
    Pending = "pending",
    Judging = "judging",
    Accepted = "accepted",
    WrongAnswer = "wrongAnswer",
    TimeLimitExceeded = "timeLimitExceeded",
    MemoryLimitExceeded = "memoryLimitExceeded",
    RuntimeError = "runtimeError",
    CompileError = "compileError",
    InternalError = "internalError",
}

/** One testcase exposed to the client (samples only on the detail query). */
export interface CodingProblemTestcase {
    /** Testcase id. */
    id: string
    /** Stdin shown for sample cases. */
    input: string
    /** Expected stdout shown for sample cases. */
    expectedOutput: string
    /** Whether this is a public sample. */
    isSample: boolean
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
}

/** Per-language starter code for a problem. */
export interface CodingProblemStarterCode {
    /** Starter code id. */
    id: string
    /** Language the starter code targets. */
    language: CodingLanguage
    /** The starter source. */
    code: string
}

/** Per-language full reference solution for a problem (revealed answer). */
export interface CodingProblemSolution {
    /** Solution id. */
    id: string
    /** Language the solution is written in. */
    language: CodingLanguage
    /** The full reference solution source. */
    code: string
}

/** A coding problem row (list view uses a subset of these fields). */
export interface CodingProblem {
    /** Problem id. */
    id: string
    /** Stable URL slug. */
    slug: string
    /** Title (localized). */
    title: string
    /** Statement Markdown (localized; present on detail). */
    statement?: string
    /** Difficulty tier. */
    difficulty: CodingDifficulty
    /** Points awarded for a first clean solve (by level: 10 / 15 / 20). */
    points: number
    /** Primary interview topic domain (drives list grouping). */
    domain: CodingDomain
    /** Topic tags. */
    tags: Array<string>
    /** Per-run CPU time limit (ms) — present on detail. */
    timeLimitMs?: number
    /** Per-run memory limit (kb) — present on detail. */
    memoryLimitKb?: number
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Sample testcases — present on detail. */
    testcases?: Array<CodingProblemTestcase>
    /** Starter code per language — present on detail. */
    starterCodes?: Array<CodingProblemStarterCode>
}

/** A user's submission row. */
export interface CodingSubmission {
    /** Submission id. */
    id: string
    /** Language submitted. */
    language: CodingLanguage
    /** Submitted source code. */
    sourceCode: string
    /** Current/terminal verdict. */
    verdict: CodingVerdict
    /** Number of testcases passed. */
    passedCount: number
    /** Total testcases evaluated. */
    totalCount: number
    /** Max run time (ms), or null until judged. */
    runtimeMs: number | null
    /** Max memory (kb), or null until judged. */
    memoryKb: number | null
    /** Compiler output when the verdict is CompileError. */
    compileOutput: string | null
    /** Serialized JSON array of per-case results (sample IO only). */
    perCaseResults: string | null
    /** Creation timestamp. */
    createdAt: string
}

/** One ranked leaderboard entry. */
export interface CodingLeaderboardEntry {
    /** User id. */
    userId: string
    /** Display username. */
    username: string
    /** Distinct solved problem count. */
    solvedCount: number
}

/* ───────────────────────── codingProblems (list) ───────────────────────── */

/** Variables for `codingProblems(request)`. */
export interface CodingProblemsRequest {
    /** Filter by difficulty. */
    difficulty?: CodingDifficulty
    /** Filter by tag. */
    tag?: string
    /** 1-based page number. */
    page?: number
    /** Page size. */
    limit?: number
}

/** Payload inside `codingProblems.data` (shared catalog — no per-user state). */
export interface QueryCodingProblemsPayload {
    /** The page of problems. */
    problems: Array<CodingProblem>
    /** Total matching the filters. */
    total: number
}

/** Response for the `codingProblems` query. */
export interface QueryCodingProblemsResponse {
    /** Top-level `codingProblems` field. */
    codingProblems: GraphQLResponse<QueryCodingProblemsPayload>
}

/* ───────────────────────── myCodingProgress (status) ───────────────────── */

/** The user's coding-practice status (mirrors backend `myCodingProgress`). */
export interface MyCodingProgress {
    /** Problem ids the user has solved (Accepted). */
    solvedProblemIds: Array<string>
    /** Problem ids the user has submitted to (any verdict). */
    attemptedProblemIds: Array<string>
    /** Problem ids whose reference solution the user revealed. */
    revealedProblemIds: Array<string>
    /** Cumulative coding points earned by the user. */
    totalPoints: number
}

/** Response for the `myCodingProgress` query. */
export interface QueryMyCodingProgressResponse {
    /** Top-level `myCodingProgress` field. */
    myCodingProgress: GraphQLResponse<MyCodingProgress>
}

/* ───────────────────────── codingProblem (detail) ──────────────────────── */

/** Variables for `codingProblem(request)`. */
export interface CodingProblemRequest {
    /** Slug of the problem to load. */
    slug: string
}

/** Response for the `codingProblem` query. */
export interface QueryCodingProblemResponse {
    /** Top-level `codingProblem` field. */
    codingProblem: GraphQLResponse<CodingProblem>
}

/* ───────────────────────── codingProblemHint ───────────────────────────── */

/** Variables for `codingProblemHint(request)`. */
export interface CodingProblemHintRequest {
    /** Slug of the problem to load the approach hint for. */
    slug: string
}

/** A problem's approach-hint markdown (sourced from Elasticsearch). */
export interface CodingProblemHint {
    /** Stable URL slug of the problem. */
    slug: string
    /** Approach-hint content in Markdown (localized). */
    hint: string
}

/** Response for the `codingProblemHint` query. */
export interface QueryCodingProblemHintResponse {
    /** Top-level `codingProblemHint` field (null when no hint authored). */
    codingProblemHint: GraphQLResponse<CodingProblemHint | null>
}

/* ────────────────────── myCodingSubmissions (history) ───────────────────── */

/** Variables for `myCodingSubmissions(request)`. */
export interface MyCodingSubmissionsRequest {
    /** Slug of the problem. */
    slug: string
    /** 1-based page number. */
    page?: number
    /** Page size. */
    limit?: number
}

/** Payload inside `myCodingSubmissions.data`. */
export interface QueryMyCodingSubmissionsPayload {
    /** The page of submissions (newest first). */
    submissions: Array<CodingSubmission>
    /** Total submissions for the problem. */
    total: number
}

/** Response for the `myCodingSubmissions` query. */
export interface QueryMyCodingSubmissionsResponse {
    /** Top-level `myCodingSubmissions` field. */
    myCodingSubmissions: GraphQLResponse<QueryMyCodingSubmissionsPayload>
}

/* ───────────────────────── codingLeaderboard ───────────────────────────── */

/** Variables for `codingLeaderboard(request)`. */
export interface CodingLeaderboardRequest {
    /** Max ranked users to return. */
    limit?: number
}

/** Response for the `codingLeaderboard` query. */
export interface QueryCodingLeaderboardResponse {
    /** Top-level `codingLeaderboard` field. */
    codingLeaderboard: GraphQLResponse<Array<CodingLeaderboardEntry>>
}
