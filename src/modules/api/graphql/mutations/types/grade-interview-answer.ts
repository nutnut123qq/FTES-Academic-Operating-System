import type { GraphQLResponse } from "../../types"

/**
 * Coarse pass/borderline/fail band the model assigns to a graded answer.
 * Mirrors backend `InterviewVerdict` (wire values are the lowercase strings).
 */
export enum InterviewVerdict {
    /** Answer is solid for the card's level — clear hire signal ("đạt"). */
    Pass = "pass",
    /** Answer is partial — some substance, notable gaps ("chưa đạt"). */
    Borderline = "borderline",
    /** Answer misses the point or is largely wrong for the level ("không đạt"). */
    Fail = "fail",
}

/** Request body for the `gradeInterviewAnswer` mutation. */
export interface GradeInterviewAnswerRequest {
    /** Deck the question card belongs to (loaded server-side). */
    flashcardDeckId: string
    /** Card whose question + model answer drive the grading. */
    flashcardCardId: string
    /** The candidate's answer, transcribed from speech on the client. */
    transcript: string
}

/** Payload inside `gradeInterviewAnswer.data` after the standard API wrapper. */
export interface InterviewGradeResultData {
    /** Overall score, integer 0–100. */
    score: number
    /** Coarse pass/borderline/fail band. */
    verdict: InterviewVerdict
    /** Concrete things the candidate got right. */
    strengths: Array<string>
    /** Concrete things missing or wrong, framed as what to add. */
    gaps: Array<string>
    /** One-line nudge toward the model answer, or null. */
    modelAnswerHint?: string | null
    /** A natural follow-up an interviewer would ask next, or null. */
    followUpQuestion?: string | null
}

/** Apollo response shape for `gradeInterviewAnswer`. */
export interface MutateGradeInterviewAnswerResponse {
    /** Top-level `gradeInterviewAnswer` field wrapping the standard API response. */
    gradeInterviewAnswer: GraphQLResponse<InterviewGradeResultData>
}
