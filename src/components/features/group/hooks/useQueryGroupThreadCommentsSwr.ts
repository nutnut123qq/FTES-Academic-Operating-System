"use client"

import useSWR from "swr"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"

/** Comment thread for a group discussion thread (mock-only). */
export interface GroupThreadComments {
    /** The discussion thread id. */
    id: string
    /** Flat one-level comment list. */
    comments: Array<PostComment>
}

/** SWR cache key for a group discussion thread's comments. */
export const groupThreadCommentsKey = (groupId: string, threadId: string) => [
    "group-thread-comments",
    groupId,
    threadId,
]

// ponytail: mock BE — no discussion comments endpoint exists. Deterministic sample.
const fetchGroupThreadCommentsMock = async (threadId: string): Promise<GroupThreadComments> => ({
    id: threadId,
    comments: [
        { id: `${threadId}-c1`, author: "An", authorUsername: "an-nguyen" /* mock */, text: "Theo mình thì nên bắt đầu với Spring Boot.", timeLabel: "2 giờ trước" },
        { id: `${threadId}-c2`, author: "Hoa", authorUsername: "hoa-le" /* mock */, text: "Node.js dễ vào hơn cho người mới nè.", timeLabel: "1 giờ trước" },
    ],
})

/**
 * Lazily loads a group discussion thread's comments (only once expanded).
 *
 * @param groupId - the owning group id.
 * @param threadId - the discussion thread whose comments to load.
 * @param enabled - true once the thread has been expanded at least once.
 */
export const useQueryGroupThreadCommentsSwr = (
    groupId: string,
    threadId: string,
    enabled: boolean,
) => {
    const { data, isLoading, error, mutate } = useSWR(
        enabled ? groupThreadCommentsKey(groupId, threadId) : null,
        () => fetchGroupThreadCommentsMock(threadId),
    )
    return { thread: data, isLoading, error, mutate }
}
