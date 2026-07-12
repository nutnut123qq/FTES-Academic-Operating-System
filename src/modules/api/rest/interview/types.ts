/**
 * Request/response DTOs for the course AI interview REST controller.
 *
 * Mirrors the backend records in the AI interview endpoints under
 * `/api/v1/ai/interview`. The student-facing fields intentionally strip
 * answer keys/rubrics; the FE only receives prompts, options, and grading
 * feedback.
 */

export type InterviewQuestionType = "MCQ" | "ESSAY" | "ORAL"

/** One question shown to the learner. */
export interface InterviewQuestionView {
    id: string
    type: InterviewQuestionType
    prompt: string
    options?: string[]
}

/** The generated question set for a course. */
export interface InterviewQuestionSetView {
    id: string
    status: string
    questions?: InterviewQuestionView[]
}

/** Template + question set returned by the intake endpoint. */
export interface InterviewTemplateView {
    template: unknown // TODO: define if the backend exposes structured config
    questionSet: InterviewQuestionSetView
}

/** Start a new attempt against a ready question set. */
export interface StartAttemptRequest {
    questionSetId: string
}

/** A newly created attempt with its question list. */
export interface StartAttemptView {
    attemptId: string
    status: string
    questions: InterviewQuestionView[]
}

/** Persist one answer (MCQ, ESSAY, or ORAL). */
export interface SubmitAnswerRequest {
    questionId: string
    type: InterviewQuestionType
    answer?: string
    selectedOption?: number
    model?: string
}

/** Result of persisting one answer. */
export interface SubmitAnswerView {
    questionId: string
    score?: number
    max?: number
    feedback?: string
    graded: boolean
}

/** Final graded attempt summary. */
export interface FinishAttemptView {
    attemptId: string
    status: string
    score: number
    maxScore: number
    feedback?: string
}

/** Arg bag for the submit-answer mutation. */
export interface SubmitAnswerParams {
    attemptId: string
    request: SubmitAnswerRequest
}
