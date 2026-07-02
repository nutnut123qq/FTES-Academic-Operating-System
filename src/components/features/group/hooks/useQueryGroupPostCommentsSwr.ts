"use client"

import useSWR from "swr"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"

/**
 * Comment thread for a group post. Group posts have no BE comment contract, so
 * this is a mock-only source keyed per (groupId, postId). Shaped like the
 * community post-comment thread so `PostCommentThread` consumes it uniformly.
 */
export interface GroupPostThread {
    /** The group post id. */
    id: string
    /** Flat one-level comment list. */
    comments: Array<PostComment>
}

/** SWR cache key for a group post's comment thread. */
export const groupPostCommentsKey = (groupId: string, postId: string) => [
    "group-post-comments",
    groupId,
    postId,
]

// ponytail: mock BE — no group comments endpoint exists. Deterministic sample.
const fetchGroupPostCommentsMock = async (postId: string): Promise<GroupPostThread> => ({
    id: postId,
    comments: [
        { id: `${postId}-c1`, author: "An", text: "Để mình đăng ký tham gia nhé!", timeLabel: "1 giờ trước" },
        { id: `${postId}-c2`, author: "Hoa", text: "Có ghi hình lại không mọi người?", timeLabel: "30 phút trước" },
    ],
})

/**
 * Lazily loads a group post's comment thread (only once expanded). Mock-only —
 * mirrors the community thread cache pattern for a drop-in BE swap.
 *
 * @param groupId - the owning group id.
 * @param postId - the group post whose comments to load.
 * @param enabled - true once the post has been expanded at least once.
 */
export const useQueryGroupPostCommentsSwr = (
    groupId: string,
    postId: string,
    enabled: boolean,
) => {
    const { data, isLoading, error, mutate } = useSWR(
        enabled ? groupPostCommentsKey(groupId, postId) : null,
        () => fetchGroupPostCommentsMock(postId),
    )
    return { thread: data, isLoading, error, mutate }
}
