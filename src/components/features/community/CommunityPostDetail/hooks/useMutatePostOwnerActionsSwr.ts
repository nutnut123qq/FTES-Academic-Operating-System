"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { useTranslations } from "next-intl"
import { toast } from "@heroui/react"
import { useRouter } from "@/i18n/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { deletePost, updatePost } from "@/modules/api/rest/community"
import {
    mutateCommunityFeeds,
    type CommunityFeedPage,
} from "../../hooks/useQueryCommunityFeedSwr"
import { postDetailKey, type PostDetail } from "../../hooks/useQueryPostDetailSwr"
import { postMetaKey, type PostMeta } from "./useQueryPostMetaSwr"
import { communityErrorMessageKey } from "./community-error-message"

/** The edited fields the minimal owner editor writes. */
export interface EditPostInput {
    /** New title (sent as-is; the BE keeps the old one when omitted). */
    title?: string
    /** New markdown body. */
    content: string
}

/**
 * Author-only post writes: edit (`PATCH /community/posts/{id}`) and delete
 * (`DELETE /community/posts/{id}`).
 *
 * `editPost` patches the detail + metadata caches optimistically and rolls both
 * back on failure. `deletePost` optimistically drops the post from EVERY mounted
 * feed cache, then navigates back to `/community` — the detail route of a deleted
 * post would only 404. Both surface the real reason on failure (403 not the
 * author / 404 already gone / 429 rate limited) instead of a generic toast.
 */
export const useMutatePostOwnerActionsSwr = () => {
    const t = useTranslations("communityHub")
    const { mutate, cache } = useSWRConfig()
    const { requireAuth } = useRequireAuth()
    const router = useRouter()

    const editPost = useCallback(
        async (postId: string, input: EditPostInput): Promise<boolean> => {
            if (!requireAuth("auth.context.generic")) {
                return false
            }

            let detailSnapshot: PostDetail | undefined
            let metaSnapshot: PostMeta | undefined

            await mutate<PostDetail>(
                postDetailKey(postId),
                (current) => {
                    detailSnapshot = current
                    return current
                        ? { ...current, title: input.title ?? current.title, body: input.content }
                        : current
                },
                { revalidate: false },
            )
            await mutate<PostMeta>(
                postMetaKey(postId),
                (current) => {
                    metaSnapshot = current
                    return current
                        ? { ...current, title: input.title ?? current.title, content: input.content }
                        : current
                },
                { revalidate: false },
            )

            try {
                await updatePost(postId, { title: input.title, content: input.content })
            } catch (error) {
                await mutate(postDetailKey(postId), detailSnapshot, { revalidate: false })
                await mutate(postMetaKey(postId), metaSnapshot, { revalidate: false })
                toast.danger(t(communityErrorMessageKey(error, "engagement.postUpdateFailed")))
                return false
            }

            toast.success(t("engagement.postUpdated"))
            // reconcile against the server copy; a refetch error must not undo the edit
            await mutate(postDetailKey(postId)).catch(() => {})
            return true
        },
        [mutate, requireAuth, t],
    )

    const removePost = useCallback(
        async (postId: string): Promise<boolean> => {
            if (!requireAuth("auth.context.generic")) {
                return false
            }

            try {
                await deletePost(postId)
            } catch (error) {
                toast.danger(t(communityErrorMessageKey(error, "engagement.postDeleteFailed")))
                return false
            }

            // the post is gone server-side → drop it from every loaded feed page
            await mutateCommunityFeeds(cache, mutate, (pages: Array<CommunityFeedPage> | undefined) =>
                pages?.map((page) => ({
                    ...page,
                    items: page.items.filter((post) => post.id !== postId),
                })),
            )
            await mutate(postDetailKey(postId), undefined, { revalidate: false })
            toast.success(t("engagement.postDeleted"))
            router.replace("/community")
            return true
        },
        [cache, mutate, requireAuth, router, t],
    )

    return { editPost, removePost }
}
