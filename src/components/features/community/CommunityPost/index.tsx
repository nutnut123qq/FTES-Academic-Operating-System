"use client"

import React, { useState } from "react"
import { CommunityCommentThread } from "../CommunityCommentThread"
import { CommunityPostCard } from "@/components/blocks/feed/CommunityPostCard"
import { ReactionType } from "@/modules/api/graphql/queries/types/discussion"
import type { QueryCommunityFeedItemData } from "@/modules/api/graphql/queries/types/community-feed"

/** Props for the {@link CommunityPost} feature. */
export interface CommunityPostProps {
    /** The post to render. */
    post: QueryCommunityFeedItemData
    /** Whether the viewer is signed in (gates reactions + the comment composer). */
    authenticated: boolean
    /** React handler for the post; omit to render the reaction bar read-only. */
    onReact?: (postId: string, type: ReactionType | null) => void
    /** Called when the thread changes (new comment) so the feed can refresh. */
    onChanged?: () => void
}

/**
 * A single feed post plus its expandable comment thread. Owns the per-post
 * "comments open" toggle so the thread only mounts (and fetches) when opened.
 *
 * @param props - {@link CommunityPostProps}
 */
export const CommunityPost = ({
    post,
    authenticated,
    onReact,
    onChanged,
}: CommunityPostProps) => {
    const [commentsOpen, setCommentsOpen] = useState(false)

    return (
        <CommunityPostCard
            post={post}
            onReact={onReact}
            onToggleComments={() => setCommentsOpen((previous) => !previous)}
        >
            {commentsOpen ? (
                <CommunityCommentThread
                    postId={post.id}
                    authenticated={authenticated}
                    onChanged={onChanged}
                />
            ) : null}
        </CommunityPostCard>
    )
}
