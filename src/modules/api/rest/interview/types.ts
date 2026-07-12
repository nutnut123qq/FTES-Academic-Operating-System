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

/** Lecturer-only full view of a generated question (includes grading material). */
export interface InterviewQuestionFullView extends InterviewQuestionView {
    answerKey?: string
    rubric?: string
}

/** The generated question set for a course. */
export interface InterviewQuestionSetView {
    id: string
    status: string
    questions?: InterviewQuestionView[]
}

/** Lecturer-only full view of the generated question set. */
export interface InterviewQuestionSetFullView {
    id: string
    status: string
    questions?: InterviewQuestionFullView[]
}

/** Template + question set returned by the intake endpoint. */
export interface InterviewTemplateView {
    template: unknown // TODO: define if the backend exposes structured config
    questionSet: InterviewQuestionSetView
}

/** Lecturer-only template + full question set view. */
export interface InterviewTemplateFullView {
    template: unknown // TODO: define if the backend exposes structured config
    questionSet: InterviewQuestionSetFullView
}

/** Question counts by type for a new interview template. */
export interface InterviewTemplateCounts {
    oral: number
    mcq: number
    essay: number
}

/** Body for generating a new interview template / question set. */
export interface GenerateInterviewTemplateRequest {
    courseRef: string
    title: string
    counts: InterviewTemplateCounts
    difficulty?: "EASY" | "MEDIUM" | "HARD"
    language?: "vi" | "en"
    context?: string
    model?: string
}

/** Response after enqueueing a new interview generation job. */
export interface GenerateInterviewTemplateView {
    templateId: string
    questionSetId: string
    status: "GENERATING" | "READY" | "FAILED"
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

/** Short status values returned for a question set. */
export type InterviewQuestionSetStatus = "GENERATING" | "READY" | "FAILED"
