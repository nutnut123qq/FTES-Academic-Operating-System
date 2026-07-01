import type { GraphQLResponse } from "../../types"
import type { CodingProblemSolution } from "../../queries/types/coding"

/** Variables for `revealCodingSolution(request)`. */
export interface RevealCodingSolutionRequest {
    /** Slug of the problem whose solution is being revealed. */
    slug: string
}

/** Outcome of revealing a problem's reference solution. */
export interface RevealCodingSolutionPayload {
    /** True when this call recorded a new reveal; false when already revealed. */
    revealed: boolean
    /**
     * The problem's full reference solutions (one per language). Served ONLY here —
     * the gated reveal flow — never from the problem detail read.
     */
    solutions: Array<CodingProblemSolution>
}

/** Response for the `revealCodingSolution` mutation. */
export interface MutateRevealCodingSolutionResponse {
    /** Top-level `revealCodingSolution` field. */
    revealCodingSolution: GraphQLResponse<RevealCodingSolutionPayload>
}
