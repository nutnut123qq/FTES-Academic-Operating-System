"use client"

import useSWR from "swr"
import { getPoll } from "@/modules/api/rest/community"
import {
    FeedTab,
    queryCommunityFeed,
} from "@/modules/api/graphql/queries/query-community-feed"

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
export const pollSwrKey = (postId?: string) => ["poll", postId ?? "latest"]

/** Feed page size scanned when discovering the latest POLL post (no explicit postId). */
const POLL_DISCOVERY_LIMIT = 20

/**
 * Find the most recent POLL post in the viewer's feed. The standalone
 * `/community/poll` page has no post context, so it shows the latest poll
 * flowing through the feed (null when none is in the first page).
 */
const resolveLatestPollPostId = async (): Promise<string | null> => {
    const result = await queryCommunityFeed({
        tab: FeedTab.ForYou,
        page: { limit: POLL_DISCOVERY_LIMIT },
    })
    return result.data?.feed.items.find((item) => item.kind === "POLL")?.id ?? null
}

/**
 * Loads a community poll from the real BE `GET /api/v1/community/posts/{postId}/poll`
 * (auth required; visibility enforced server-side). When `postId` is omitted the
 * latest POLL post from the viewer's feed is used; `poll` is `null` when no poll
 * post is discoverable.
 */
export const useQueryPollSwr = (postId?: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        pollSwrKey(postId),
        async (): Promise<Poll | null> => {
            const id = postId ?? (await resolveLatestPollPostId())
            if (!id) {
                return null
            }
            const dto = await getPoll(id)
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
