"use client"

import { useCallback } from "react"
import useSWRMutation from "swr/mutation"

import { toggleResourceCommentLikeMock } from "./resource-comments-mock"
import type { ResourceCommentItem } from "./resource-comments-mock"
import { resourceCommentsSwrKey } from "./useQueryResourceCommentsSwr"
import type { ResourceCommentsSwrKey } from "./useQueryResourceCommentsSwr"

/**
 * Toggles the viewer's like on a comment: optimistic flip of `likedByMe` with
 * a ±1 `likeCount`, rolled back if the mutation fails. Mocked; errors are
 * swallowed into the rollback (no draft to restore).
 * @param resourceId - The resource owning the comment.
 */
export const useMutateToggleResourceCommentLikeSwr = (resourceId: string) => {
    const { trigger, isMutating } = useSWRMutation<
        Array<ResourceCommentItem>,
        Error,
        ResourceCommentsSwrKey,
        string
    >(
        resourceCommentsSwrKey(resourceId),
        ([, id], { arg }) => toggleResourceCommentLikeMock(id, arg),
    )

    const toggleLike = useCallback(
        (commentId: string) =>
            trigger(commentId, {
                optimisticData: (current) =>
                    (current ?? []).map((comment) =>
                        comment.id === commentId
                            ? {
                                ...comment,
                                likedByMe: !comment.likedByMe,
                                likeCount: Math.max(
                                    0,
                                    comment.likeCount + (comment.likedByMe ? -1 : 1),
                                ),
                            }
                            : comment,
                    ),
                populateCache: true,
                rollbackOnError: true,
                revalidate: false,
                // a failed like just rolls back — nothing for the caller to restore
                throwOnError: false,
            }),
        [trigger],
    )

    return { toggleLike, isMutating }
}
