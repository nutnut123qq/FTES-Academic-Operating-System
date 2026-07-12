"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { reactToPost, unreactPost } from "@/modules/api/rest/community"
import { subjectFeedKey, type FeedScope, type SubjectPost } from "./useQuerySubjectFeedSwr"

/**
 * Toggles the current user's like on a subject "Thảo luận" post. These are REAL
 * community posts (scoped to the subject via `subjectWorkspace.community`), so the
 * write REUSES the community REST reactions API (`PUT`/`DELETE
 * /community/reactions`) with an optimistic update over the
 * `["subject-feed", subjectId, locale, scope]` cache and rollback on failure. Guests get
 * the `AuthenticationModal` and nothing toggles.
 *
 * @param subjectId - the owning subject id.
 * @param scope - the current feed scope so the optimistic update targets the right cache.
 */
export const useMutateReactSubjectPostSwr = (subjectId: string, scope: FeedScope) => {
    const t = useTranslations("subjects")
    const locale = useLocale()
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()

    return useCallback(
        async (postId: string) => {
            if (!requireAuth("auth.context.like")) {
                return
            }
            const key = subjectFeedKey(subjectId, locale, scope)

            // snapshot for rollback + capture the intended next state for the write
            let snapshot: Array<SubjectPost> | undefined
            let nextLiked = false
            await mutate<Array<SubjectPost>>(
                key,
                (current) => {
                    snapshot = current
                    return current?.map((post) => {
                        if (post.id !== postId) {
                            return post
                        }
                        nextLiked = !post.liked
                        return {
                            ...post,
                            liked: nextLiked,
                            reactions: Math.max(0, post.reactions + (nextLiked ? 1 : -1)),
                        }
                    })
                },
                { revalidate: false },
            )

            try {
                if (nextLiked) {
                    await reactToPost(postId, { reactionType: "LIKE" })
                } else {
                    await unreactPost(postId)
                }
            } catch {
                // WRITE failed (transport reject OR non-2xx envelope) → roll back.
                await mutate(key, snapshot, { revalidate: false })
                toast.danger(t("community.likeFailed"))
            }
        },
        [subjectId, scope, locale, mutate, requireAuth, t],
    )
}
