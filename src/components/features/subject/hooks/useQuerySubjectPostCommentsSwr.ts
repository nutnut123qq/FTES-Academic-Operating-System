"use client"

import useSWR from "swr"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"

/**
 * Comment thread for a subject "Thảo luận" post. No BE contract exists, so this
 * is a mock-only source keyed per (subjectId, postId). Shaped like the community
 * thread so `PostCommentThread` consumes it uniformly.
 */
export interface SubjectPostThread {
    /** The subject post id. */
    id: string
    /** Flat one-level comment list. */
    comments: Array<PostComment>
}

/** SWR cache key for a subject post's comment thread. */
export const subjectPostCommentsKey = (subjectId: string, postId: string) => [
    "subject-post-comments",
    subjectId,
    postId,
]

// ponytail: mock BE — no subject comments endpoint exists. Deterministic sample.
const fetchSubjectPostCommentsMock = async (postId: string): Promise<SubjectPostThread> => ({
    id: postId,
    comments: [
        { id: `${postId}-c1`, author: "An", authorUsername: "an-nguyen" /* mock */, text: "Chuẩn luôn, mình cũng hay bị chỗ này.", timeLabel: "1 giờ trước" },
        { id: `${postId}-c2`, author: "Hoa", authorUsername: "hoa-le" /* mock */, text: "Cảm ơn bạn đã chia sẻ nhé!", timeLabel: "45 phút trước" },
    ],
})

/**
 * Lazily loads a subject post's comment thread (only once expanded). Mock-only.
 *
 * @param subjectId - the owning subject id.
 * @param postId - the subject post whose comments to load.
 * @param enabled - true once the post has been expanded at least once.
 */
export const useQuerySubjectPostCommentsSwr = (
    subjectId: string,
    postId: string,
    enabled: boolean,
) => {
    const { data, isLoading, error, mutate } = useSWR(
        enabled ? subjectPostCommentsKey(subjectId, postId) : null,
        () => fetchSubjectPostCommentsMock(postId),
    )
    return { thread: data, isLoading, error, mutate }
}
