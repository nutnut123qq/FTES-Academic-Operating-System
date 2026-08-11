"use client"

import { useCallback, useState } from "react"
import { useSWRConfig } from "swr"

import {
    postFeImageComment,
    type FeImageCommentPage,
    type FeImageCommentView,
    type PostFeImageCommentRequest,
} from "@/modules/api/rest/resource"
import { feAlbumSwrKey } from "./useQueryFeAlbumSwr"
import { feImageCommentsSwrKey } from "./useQueryFeImageCommentsSwr"
import {
    buildOptimisticFeImageComment,
    insertFeImageComment,
    replaceFeImageComment,
} from "./feImageCommentTree"

/** Trigger arg: the album image, the cached page to patch, and the comment payload. */
export interface CreateFeImageCommentArg {
    resourceId: string
    imageId: string
    /** 1-indexed page currently rendered — identifies the SWR entry to patch. */
    page: number
    request: PostFeImageCommentRequest
    /** Signed-in viewer's id, so the placeholder row renders as their own. */
    viewerId?: string | null
}

/**
 * Posts a comment (or a one-level reply via `parentId`) on ONE FE album image
 * (`POST /api/v1/resources/{id}/images/{imageId}/comments`) and patches the cached
 * thread around it.
 *
 * The node shows up immediately (optimistic), is swapped for the row the server
 * actually stored — real id, server `createdAt`, and the root the BE re-parented a
 * reply-of-reply onto — once the POST resolves, and the page is restored from the
 * pre-write snapshot when the write fails, so a comment is never left looking saved
 * when it was not. The album is revalidated afterwards so the per-image
 * `commentCount` badge follows the thread.
 *
 * `submit` REJECTS on a failed write (after rolling the cache back) so the caller keeps
 * the draft and toasts; a refetch failure AFTER a successful write is swallowed — the
 * comment did land.
 *
 * @returns `submit(arg)` resolving the saved {@link FeImageCommentView}, plus `isMutating`.
 */
export const useMutateCreateFeImageCommentSwr = () => {
    const { mutate } = useSWRConfig()
    const [isMutating, setIsMutating] = useState(false)

    const submit = useCallback(
        async (arg: CreateFeImageCommentArg): Promise<FeImageCommentView> => {
            const key = feImageCommentsSwrKey(arg.resourceId, arg.imageId, arg.page)
            const optimistic = buildOptimisticFeImageComment(
                arg.imageId,
                arg.request.content,
                arg.request.parentId,
                arg.viewerId,
            )

            let snapshot: FeImageCommentPage | undefined
            setIsMutating(true)
            await mutate<FeImageCommentPage>(
                key,
                (current) => {
                    snapshot = current
                    return current ? insertFeImageComment(current, optimistic) : current
                },
                { revalidate: false },
            )

            try {
                const saved = await postFeImageComment(
                    arg.resourceId,
                    arg.imageId,
                    arg.request,
                )
                await mutate<FeImageCommentPage>(
                    key,
                    (current) =>
                        current
                            ? replaceFeImageComment(current, optimistic.id, saved)
                            : current,
                    { revalidate: false },
                )
                // Re-sync ordering/pagination + the album's per-image commentCount badge.
                // A refetch error must NOT surface as a failed comment — the write landed.
                await mutate(key).catch(() => undefined)
                await mutate(feAlbumSwrKey(arg.resourceId)).catch(() => undefined)
                return saved
            } catch (error) {
                await mutate(key, snapshot, { revalidate: false })
                throw error instanceof Error ? error : new Error(String(error))
            } finally {
                setIsMutating(false)
            }
        },
        [mutate],
    )

    return { submit, isMutating }
}
