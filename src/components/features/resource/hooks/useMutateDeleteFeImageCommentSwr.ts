"use client"

import { useCallback, useState } from "react"
import { useSWRConfig } from "swr"

import {
    deleteFeImageComment,
    type FeImageCommentPage,
} from "@/modules/api/rest/resource"
import { feAlbumSwrKey } from "./useQueryFeAlbumSwr"
import { feImageCommentsSwrKey } from "./useQueryFeImageCommentsSwr"
import { tombstoneFeImageComment } from "./feImageCommentTree"

/** Trigger arg: the comment to delete + the cached thread page it is rendered on. */
export interface DeleteFeImageCommentArg {
    commentId: string
    resourceId: string
    imageId: string
    /** 1-indexed page currently rendered — identifies the SWR entry to patch. */
    page: number
}

/**
 * Soft-deletes one FE image comment
 * (`DELETE /api/v1/resources/comments/images/{commentId}`).
 *
 * The row is tombstoned in the cache immediately — mirroring the BE's soft delete, so
 * the replies under a deleted parent stay visible — the refetch then swaps in the real
 * tombstone body the server wrote, and the pre-delete snapshot is restored if the
 * request fails. `remove` rejects on failure so the caller can toast.
 *
 * @returns `remove(arg)` plus `isMutating`.
 */
export const useMutateDeleteFeImageCommentSwr = () => {
    const { mutate } = useSWRConfig()
    const [isMutating, setIsMutating] = useState(false)

    const remove = useCallback(
        async (arg: DeleteFeImageCommentArg): Promise<void> => {
            const key = feImageCommentsSwrKey(arg.resourceId, arg.imageId, arg.page)

            let snapshot: FeImageCommentPage | undefined
            setIsMutating(true)
            await mutate<FeImageCommentPage>(
                key,
                (current) => {
                    snapshot = current
                    return current
                        ? tombstoneFeImageComment(current, arg.commentId)
                        : current
                },
                { revalidate: false },
            )

            try {
                await deleteFeImageComment(arg.commentId)
                await mutate(key).catch(() => undefined)
                await mutate(feAlbumSwrKey(arg.resourceId)).catch(() => undefined)
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
