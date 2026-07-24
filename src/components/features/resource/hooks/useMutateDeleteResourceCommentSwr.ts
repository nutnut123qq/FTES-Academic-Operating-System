"use client"

import useSWRMutation from "swr/mutation"

import { deleteResourceComment } from "@/modules/api/rest/resource"

/**
 * Deletes a resource comment (owner or moderator → soft-delete `status=DELETED`)
 * via the real C-4 BE (`DELETE /api/v1/resources/comments/{commentId}`). The
 * caller revalidates the comments page on success; `trigger` rejects on failure.
 * Mirrors `useDeleteLessonCommentSwr`.
 */
export const useMutateDeleteResourceCommentSwr = () => {
    return useSWRMutation<void, Error, "RESOURCE_COMMENT_DELETE", string>(
        "RESOURCE_COMMENT_DELETE",
        (_key, { arg: commentId }) => deleteResourceComment(commentId),
    )
}
