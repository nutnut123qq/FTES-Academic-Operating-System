"use client"

import React, { useCallback } from "react"
import useSWR from "swr"
import { useAppSelector } from "@/redux/hooks"
import { InteractionBar } from "@/components/reuseable/Discussion/InteractionBar"
import { GraphQLHeadersKey, type GraphQLHeaders } from "@/modules/api/graphql/types"
import { mutateReactToContent } from "@/modules/api/graphql/mutations/mutation-react-to-content"
import { queryContentReactions } from "@/modules/api/graphql/queries/query-content-reactions"
import { ReactionType } from "@/modules/api/graphql/queries/types/discussion"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Reaction footer for a lesson — the emotion picker + view count that belongs to
 * the CONTENT, rendered at the foot of the reading card (border-t divider) à la
 * Medium / Substack, not as an orphan strip between cards.
 *
 * Owns its own reaction summary SWR keyed identically to {@link import("./index").ContentDiscussion}
 * (`["content-discussion-reactions", contentId]`) so the two share one cache/request;
 * the discussion container keeps the realtime socket and revalidates this shared key
 * on `ContentReactionChanged`, so this bar live-updates without a second subscription.
 */
export const ContentReactionBar = ({ className }: WithClassNames<undefined>) => {
    const contentId = useAppSelector((state) => state.content.entity?.id)
    // the enrolled-guard on the reactions resolver requires the X-Course-Id header
    const courseId = useAppSelector((state) => state.course.entity?.id)

    const courseHeaders: GraphQLHeaders | undefined = courseId
        ? { [GraphQLHeadersKey.XCourseId]: courseId }
        : undefined

    // shared key with ContentDiscussion → SWR dedupes to one request + one cache entry
    const reactionsSwr = useSWR(
        contentId && courseId ? ["content-discussion-reactions", contentId] : null,
        async () => {
            const response = await queryContentReactions({
                request: { contentId: contentId as string },
                headers: courseHeaders,
            })
            return response.data?.contentReactions.data
        },
    )

    const onReact = useCallback(async (type: ReactionType | null) => {
        if (!contentId || !courseId) {
            return
        }
        await mutateReactToContent({
            request: { contentId, type },
            headers: courseHeaders,
        })
        void reactionsSwr.mutate()
    }, [contentId, courseId, courseHeaders, reactionsSwr])

    // mirror the discussion guard: nothing to react to until both ids resolve
    if (!contentId || !courseId) {
        return null
    }

    return (
        <InteractionBar
            className={className}
            summary={reactionsSwr.data ?? undefined}
            onReact={onReact}
            viewCount={reactionsSwr.data?.viewCount}
        />
    )
}
