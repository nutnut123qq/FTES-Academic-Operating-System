"use client"

import { useCallback, useState } from "react"
import { useSWRConfig } from "swr"

import {
    likeResourceComment,
    unlikeResourceComment,
    type ResourceCommentsPage,
} from "@/modules/api/rest/resource"
import { resourceCommentsSwrKey } from "./useQueryResourceCommentsSwr"
import {
    applyResourceCommentLikeResult,
    patchResourceComment,
    toggleResourceCommentLike,
} from "./resourceCommentTree"

/** Trigger arg: the comment to (un)like + the cached page it is rendered on. */
export interface LikeResourceCommentArg {
    commentId: string
    resourceId: string
    /** 1-indexed page currently rendered — identifies the SWR entry to patch. */
    page: number
    /** State the viewer is moving to: `true` = like (`PUT`), `false` = unlike (`DELETE`). */
    nextLiked: boolean
}

/**
 * Likes / unlikes one resource comment — root or reply — through the real BE
 * (`PUT`/`DELETE /api/v1/resources/comments/{commentId}/like`) and patches the cached
 * comments page in place.
 *
 * The heart flips before the round-trip and the counter moves by one; when the call lands,
 * the server's `{active, likeCount}` OVERWRITES the guess, so a like somebody else added
 * mid-flight is reflected instead of a client-side recount. Nothing is counted locally from
 * scratch — `likeCount`/`likedByMe` always originate in the BE list.
 *
 * Rollback re-reads the cache AT REVERT TIME (a functional `mutate`) and applies the inverse
 * flip, rather than restoring a snapshot taken before the write: a comment posted, deleted,
 * or refetched while the like was in flight must not be resurrected/erased by the undo.
 * Because {@link toggleResourceCommentLike} no-ops when the comment already sits in the
 * requested state, a revert of an already-reverted row cannot double-decrement.
 *
 * `toggle` REJECTS on failure (after the revert) so the caller can toast.
 *
 * @returns `toggle(arg)` plus `isMutating`.
 */
export const useMutateLikeResourceCommentSwr = () => {
    const { mutate } = useSWRConfig()
    const [isMutating, setIsMutating] = useState(false)

    const toggle = useCallback(
        async (arg: LikeResourceCommentArg): Promise<void> => {
            const key = resourceCommentsSwrKey(arg.resourceId, arg.page)
            const flip = (liked: boolean) =>
                mutate<ResourceCommentsPage>(
                    key,
                    (current) =>
                        current
                            ? patchResourceComment(current, arg.commentId, (comment) =>
                                  toggleResourceCommentLike(comment, liked),
                              )
                            : current,
                    { revalidate: false },
                )

            setIsMutating(true)
            await flip(arg.nextLiked)

            try {
                const result = arg.nextLiked
                    ? await likeResourceComment(arg.commentId)
                    : await unlikeResourceComment(arg.commentId)
                await mutate<ResourceCommentsPage>(
                    key,
                    (current) =>
                        current
                            ? patchResourceComment(current, arg.commentId, (comment) =>
                                  applyResourceCommentLikeResult(comment, result),
                              )
                            : current,
                    { revalidate: false },
                )
            } catch (error) {
                await flip(!arg.nextLiked)
                throw error instanceof Error ? error : new Error(String(error))
            } finally {
                setIsMutating(false)
            }
        },
        [mutate],
    )

    return { toggle, isMutating }
}
