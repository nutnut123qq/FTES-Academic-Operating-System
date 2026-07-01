import type { GraphQLResponse } from "../../types"
import type { CodingLanguage } from "../../queries/types/coding"

/** Behavioral telemetry measured client-side to flag potential AI/paste-cheat usage. */
export interface CodingTelemetry {
    /** Number of paste events. */
    pasteCount?: number
    /** Size of the largest single paste in characters. */
    pasteSizeMax?: number
    /** Total keystrokes typed. */
    keystrokeCount?: number
    /** Number of times the editor or window lost focus. */
    tabBlurCount?: number
    /** Time elapsed from opening problem to submit, in milliseconds. */
    timeOpenToSubmitMs?: number
}

/** Variables for `submitCodingSolution(request)`. */
export interface SubmitCodingSolutionRequest {
    /** Slug of the problem being solved. */
    slug: string
    /** Language of the submission. */
    language: CodingLanguage
    /** Source code to judge. */
    sourceCode: string
    /** Optional client behavioural telemetry for anti-cheat scoring. */
    telemetry?: CodingTelemetry
}

/** Identifiers returned after a submission is accepted for judging. */
export interface SubmitCodingSolutionPayload {
    /** The created submission id. */
    submissionId: string
    /** The judging job id to subscribe to over Socket.IO. */
    jobId: string
}

/** Response for the `submitCodingSolution` mutation. */
export interface MutateSubmitCodingSolutionResponse {
    /** Top-level `submitCodingSolution` field. */
    submitCodingSolution: GraphQLResponse<SubmitCodingSolutionPayload>
}
