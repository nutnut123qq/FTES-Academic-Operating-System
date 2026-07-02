"use client"

import { useCallback } from "react"
import useSWRMutation from "swr/mutation"

import { deleteResourceCommentMock } from "./resource-comments-mock"
import type { ResourceCommentItem } from "./resource-comments-mock"
import { resourceCommentsSwrKey } from "./useQueryResourceCommentsSwr"
import type { ResourceCommentsSwrKey } from "./useQueryResourceCommentsSwr"

/**
 * Deletes one of the viewer's own comments with an optimistic removal (the
 * comment and its replies disappear immediately) and restore on error. Mocked;
 * the trigger throws on failure so callers can surface an inline error.
 * @param resourceId - The resource owning the comment.
 */
export const useMutateDeleteResourceCommentSwr = (resourceId: string) => {
    const { trigger, isMutating } = useSWRMutation<
        Array<ResourceCommentItem>,
        Error,
        ResourceCommentsSwrKey,
        string
    >(
        resourceCommentsSwrKey(resourceId),
        ([, id], { arg }) => deleteResourceCommentMock(id, arg),
    )

    const deleteComment = useCallback(
        (commentId: string) =>
            trigger(commentId, {
                optimisticData: (current) =>
                    (current ?? []).filter(
                        (comment) => comment.id !== commentId && comment.parentId !== commentId,
                    ),
                populateCache: true,
                rollbackOnError: true,
                revalidate: false,
            }),
        [trigger],
    )

    return { deleteComment, isMutating }
}
