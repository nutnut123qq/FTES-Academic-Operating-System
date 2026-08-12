"use client"

import useSWR from "swr"

import { getChallengeComments } from "@/modules/api/rest/challenges/challenges"
import type { ChallengeCommentPage } from "@/modules/api/rest/challenges/types"

/** SWR key for ONE page of a challenge's comment thread (shared by query + mutations). */
export const challengeCommentsSwrKey = (challengeId: string, page: number) =>
    ["CHALLENGE_COMMENTS_SWR", challengeId, page] as const

/** The SWR key tuple type for challenge comments. */
export type ChallengeCommentsSwrKey = ReturnType<typeof challengeCommentsSwrKey>

/**
 * Loads one page of a challenge's discussion thread
 * (`GET /api/v1/challenges/{id}/comments?page=&size=`). Top-level rows carry one level of
 * nested `replies`, and every author card is already resolved by the BE — this hook makes
 * exactly one request per page, never one per commenter.
 *
 * The id here is the challenge's real **UUID** (`ChallengeView.id`), not the routing slug:
 * the endpoint binds a `UUID` path variable. An empty id gates the fetch off, which is what
 * an ordinary (non-paper) challenge or an unresolved detail read passes.
 *
 * @param challengeId - The challenge UUID whose thread to read; `""` gates the fetch off.
 * @param page - 1-indexed page number (the BE contract is 1-based).
 * @returns The raw SWR handle over {@link ChallengeCommentPage}.
 */
export const useQueryChallengeCommentsSwr = (challengeId: string, page: number) => {
    return useSWR<ChallengeCommentPage, Error>(
        challengeId ? challengeCommentsSwrKey(challengeId, page) : null,
        () => getChallengeComments(challengeId, { page }),
    )
}
