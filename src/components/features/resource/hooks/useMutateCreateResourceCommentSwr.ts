"use client"

import { useCallback, useState } from "react"
import { useSWRConfig } from "swr"

import {
    postResourceComment,
    type PostResourceCommentRequest,
    type ResourceCommentView,
    type ResourceCommentsPage,
} from "@/modules/api/rest/resource"
import { resourceCommentsSwrKey } from "./useQueryResourceCommentsSwr"
import {
    buildOptimisticResourceComment,
    insertResourceComment,
    replaceResourceComment,
} from "./resourceCommentTree"

/** Trigger arg: the resource, the cached page to patch, and the comment/reply payload. */
export interface CreateResourceCommentArg {
    resourceId: string
    /** 1-indexed page currently rendered — identifies the SWR entry to patch. */
    page: number
    request: PostResourceCommentRequest
    /** Signed-in viewer's id, so the placeholder row renders as "you". */
    viewerId?: string | null
}

/**
 * Posts a resource Q&A comment (or a one-level reply via `parentId`) to the real C-4 BE
 * (`POST /api/v1/resources/{id}/comments`) and patches the cached comments page around it.
 *
 * The node shows up immediately (optimistic), is swapped for the row the server actually
 * stored — real id, server `createdAt`, and the root the BE re-parented a reply-of-reply
 * onto — once the POST resolves, and the page is restored from the pre-write snapshot when
 * the write fails, so a comment is never left looking saved when it was not. Nothing about
 * the author is fabricated in the CACHE: the placeholder carries the viewer's `userId` and
 * the renderer derives the whole identity — "Bạn" plus the reader's own photo — from that
 * id exactly as it does for a BE row, so the two are indistinguishable across the swap.
 *
 * `submit` REJECTS on a failed write (after rolling the cache back) so the caller keeps the
 * draft and toasts; a refetch failure AFTER a successful write is swallowed — the comment
 * did land, and reporting it as an error would be a lie.
 *
 * @returns `submit(arg)` resolving the saved {@link ResourceCommentView}, plus `isMutating`.
 */
export const useMutateCreateResourceCommentSwr = () => {
    const { mutate } = useSWRConfig()
    const [isMutating, setIsMutating] = useState(false)

    const submit = useCallback(
        async (arg: CreateResourceCommentArg): Promise<ResourceCommentView> => {
            const key = resourceCommentsSwrKey(arg.resourceId, arg.page)
            const optimistic = buildOptimisticResourceComment(
                arg.request.content,
                arg.request.parentId,
                arg.viewerId,
            )

            let snapshot: ResourceCommentsPage | undefined
            setIsMutating(true)
            await mutate<ResourceCommentsPage>(
                key,
                (current) => {
                    snapshot = current
                    return current ? insertResourceComment(current, optimistic) : current
                },
                { revalidate: false },
            )

            try {
                const saved = await postResourceComment(arg.resourceId, arg.request)
                await mutate<ResourceCommentsPage>(
                    key,
                    (current) =>
                        current ? replaceResourceComment(current, optimistic.id, saved) : current,
                    { revalidate: false },
                )
                // Re-sync ordering/pagination with the BE. A refetch error must NOT surface as
                // a failed comment — the write already succeeded.
                await mutate(key).catch(() => undefined)
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
