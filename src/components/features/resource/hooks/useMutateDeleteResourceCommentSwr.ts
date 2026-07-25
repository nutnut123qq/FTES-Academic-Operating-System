"use client"

import { useCallback, useState } from "react"
import { useSWRConfig } from "swr"

import { deleteResourceComment, type ResourceCommentsPage } from "@/modules/api/rest/resource"
import { resourceCommentsSwrKey } from "./useQueryResourceCommentsSwr"
import { tombstoneResourceComment } from "./resourceCommentTree"

/** Trigger arg: the comment to delete + the cached page it is rendered on. */
export interface DeleteResourceCommentArg {
    commentId: string
    resourceId: string
    /** 1-indexed page currently rendered — identifies the SWR entry to patch. */
    page: number
}

/**
 * Deletes a resource comment (owner or moderator → soft-delete `status=DELETED`) via the
 * real C-4 BE (`DELETE /api/v1/resources/comments/{commentId}`).
 *
 * The row is tombstoned in the cache immediately — mirroring the BE's soft delete, so the
 * replies under a deleted parent stay visible — and the pre-delete snapshot is restored if
 * the request fails. `remove` rejects on failure so the caller can toast.
 *
 * @returns `remove(arg)` plus `isMutating`.
 */
export const useMutateDeleteResourceCommentSwr = () => {
    const { mutate } = useSWRConfig()
    const [isMutating, setIsMutating] = useState(false)

    const remove = useCallback(
        async (arg: DeleteResourceCommentArg): Promise<void> => {
            const key = resourceCommentsSwrKey(arg.resourceId, arg.page)

            let snapshot: ResourceCommentsPage | undefined
            setIsMutating(true)
            await mutate<ResourceCommentsPage>(
                key,
                (current) => {
                    snapshot = current
                    return current ? tombstoneResourceComment(current, arg.commentId) : current
                },
                { revalidate: false },
            )

            try {
                await deleteResourceComment(arg.commentId)
                await mutate(key).catch(() => undefined)
            } catch (error) {
                await mutate(key, snapshot, { revalidate: false })
                throw error instanceof Error ? error : new Error(String(error))
            } finally {
                setIsMutating(false)
            }
        },
        [mutate],
    )

    return { remove, isMutating }
}
