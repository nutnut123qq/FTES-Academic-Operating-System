"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { acceptAnswer } from "@/modules/api/rest/community"
import { postMetaKey, type PostMeta } from "./useQueryPostMetaSwr"
import { communityErrorMessageKey } from "./community-error-message"

/**
 * Marks a top-level comment as the accepted answer of a QUESTION post
 * (`POST /api/v1/community/posts/{postId}/accepted-answer`, author only).
 *
 * The badge moves optimistically in the post-metadata cache and rolls back on
 * failure (403 when the viewer is not the author, 404 when post/comment is gone).
 */
export const useMutateAcceptAnswerSwr = () => {
    const t = useTranslations("communityHub")
    const { mutate } = useSWRConfig()
    const { requireAuthAsync } = useRequireAuth()

    return useCallback(
        async (postId: string, commentId: string): Promise<boolean> => {
            if (!(await requireAuthAsync("auth.context.generic"))) {
                return false
            }

            let snapshot: PostMeta | undefined
            await mutate<PostMeta>(
                postMetaKey(postId),
                (current) => {
                    snapshot = current
                    return current ? { ...current, acceptedCommentId: commentId } : current
                },
                { revalidate: false },
            )

            try {
                await acceptAnswer(postId, { commentId })
            } catch (error) {
                await mutate(postMetaKey(postId), snapshot, { revalidate: false })
                toast.danger(t(communityErrorMessageKey(error, "engagement.acceptAnswerFailed")))
                return false
            }

            toast.success(t("engagement.acceptAnswerDone"))
            return true
        },
        [mutate, requireAuthAsync, t],
    )
}
