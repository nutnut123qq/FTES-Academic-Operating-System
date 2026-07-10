/**
 * Request/response DTOs for the mock-interview REST controller.
 *
 * Mirrors the backend records in `vn.ftes.aos.ai.mockinterview.web.MockInterviewController`.
 */

/** Tier the learner picks; the backend normalises it to a `level`. */
export type MockInterviewTier = "junior" | "middle" | "senior"

export interface DrawSessionRequest {
    courseRef: string
    tier?: MockInterviewTier
    questionCount?: number
}

/** One drawn question shown to the learner (ideal answer/rubric are never sent). */
export interface SeedTopicView {
    id: string
    kind: string
    title: string
    prompt: string
}

/** A single answered turn in the transcript. */
export interface MockInterviewTurn {
    questionIndex: number
    answer: string
}

export interface SessionDrawView {
    sessionId: string
    level: string
    mode: string
    deadlineAt: string
    seedTopics: Array<SeedTopicView>
}

export interface SessionView {
    id: string
    courseRef: string
    level: string
    mode: string
    status: string
    questionIndex: number
    deadlineAt: string
    seedTopics: Array<SeedTopicView>
    turns: Array<MockInterviewTurn>
}

export interface AnswerUpsertRequest {
    questionIndex: number
    answer: string
}

export interface AnswerSavedView {
    questionIndex: number
    saved: boolean
}

export interface QuestionReview {
    questionIndex: number
    score: number
    feedback: string
}

/**
 * Graded scorecard. `attributeScores`/`strengths`/`gaps`/`followUpQuestion` are null in
 * the current backend (the grade path aggregates per-answer scores only).
 */
export interface ScorecardView {
    attemptId: string
    overallScore: number
    verdict: string
    questionReviews: Array<QuestionReview>
    attributeScores?: Record<string, number> | null
    strengths?: Array<string> | null
    gaps?: Array<string> | null
    followUpQuestion?: string | null
}

export interface SyncTurnsRequest {
    turns: Array<MockInterviewTurn>
    questionIndex: number
}

export interface SyncResultView {
    success: boolean
}

/** Arg bag for the save-answer mutation (useSWRMutation takes a single arg). */
export interface SaveAnswerParams {
    sessionId: string
    request: AnswerUpsertRequest
}

/** Arg bag for the sync-turns mutation. */
export interface SyncTurnsParams {
    sessionId: string
    request: SyncTurnsRequest
}

export interface AttemptSummaryView {
    attemptId: string
    sessionId: string
    level?: string
    overallScore: number
    verdict: string
    countsToReadiness: boolean
    attributeScores?: Record<string, number> | null
    createdAt: string
}

export interface AttemptListView {
    totalCount: number
    items: Array<AttemptSummaryView>
}

export interface MockInterviewTrendPoint {
    at: string
    score: number
    verdict: string
}

export interface MockInterviewStatsView {
    insufficientData: boolean
    attemptCount: number
    avgScore: number
    verdictCounts: Record<string, number>
    trend: Array<MockInterviewTrendPoint>
}
