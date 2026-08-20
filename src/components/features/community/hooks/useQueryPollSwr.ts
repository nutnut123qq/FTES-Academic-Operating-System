"use client"

import useSWR from "swr"
import { getPoll } from "@/modules/api/rest/community"

/** A poll option (`voteCount` mapped to `votes`). */
export interface PollOption {
    id: string
    label: string
    votes: number
}

/** A community poll (real BE `PollResponse`). */
export interface Poll {
    /** Post the poll belongs to — target of `POST /community/posts/{id}/poll-votes`. */
    postId: string
    question: string
    /** ISO close timestamp, or null when the poll has no deadline. */
    closesAt: string | null
    options: Array<PollOption>
    /** The viewer's voted option id, or null when the viewer has not voted. */
    myOptionId: string | null
}

/** SWR cache key for a poll (shared with the vote mutation's revalidate). */
export const pollSwrKey = (postId: string) => ["poll", postId]

/**
 * Loads ONE community poll from the real BE `GET /api/v1/community/posts/{postId}/poll`
 * (auth required; visibility enforced server-side).
 *
 * `postId` is REQUIRED on purpose. It used to be optional, and the omitted case scanned
 * the first 20 For-You items for a `kind === "POLL"` row — which made `/community/poll`
 * a page that could only ever open ONE poll (and an empty page whenever no poll made the
 * first feed page). Listing every poll is `CommunityPollList`'s job now, via the
 * server-side `communitySearch(postType: "POLL")` filter; keeping the parameter optional
 * would have left that feed-scanning path alive for the next caller with no compiler warning.
 *
 * `poll` is `null` only while loading or after a failure — never "no poll exists".
 */
export const useQueryPollSwr = (postId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        pollSwrKey(postId),
        async (): Promise<Poll> => {
            const dto = await getPoll(postId)
            return {
                postId: dto.postId,
                question: dto.question,
                closesAt: dto.closesAt ?? null,
                myOptionId: dto.myOptionId ?? null,
                options: dto.options.map((option) => ({
                    id: option.id,
                    label: option.label,
                    votes: option.voteCount,
                })),
            }
        },
    )
    return { poll: data ?? null, isLoading, error, mutate }
}
