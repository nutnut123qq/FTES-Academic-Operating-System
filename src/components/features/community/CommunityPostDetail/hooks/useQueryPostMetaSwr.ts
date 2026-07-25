"use client"

import useSWR from "swr"
import { getPost } from "@/modules/api/rest/community"
import type { PostResponse } from "@/modules/api/rest/community"

/**
 * The post facts the detail page needs that the GraphQL `post(id)` selection does
 * NOT expose: the post KIND (only a `QUESTION` gets the accept-answer flow), the
 * accepted answer, the raw author id (owner gate that survives a display-name
 * change) and the raw title/content used to prefill the edit dialog.
 */
export interface PostMeta {
    id: string
    /** BE `postType` — QUESTION / DISCUSSION / ANNOUNCEMENT / POLL / … */
    postType: string
    /** Comment marked as the accepted answer, when the author picked one. */
    acceptedCommentId?: string
    /** Author user id (uuid) — authoritative owner check. */
    authorId: string
    /** Raw title (edit prefill; the GraphQL detail returns "" when absent). */
    title: string
    /** Raw markdown body (edit prefill). */
    content: string
}

/** SWR cache key for a post's REST metadata — shared with the accept/edit writes. */
export const postMetaKey = (postId: string) => ["post-meta", postId]

/** Map the REST post envelope to the small metadata contract above. */
export const toPostMeta = (post: PostResponse): PostMeta => ({
    id: post.id,
    postType: post.postType,
    acceptedCommentId: post.acceptedCommentId,
    authorId: post.authorId,
    title: post.title ?? "",
    content: post.content,
})

/**
 * Loads a post's REST metadata (`GET /api/v1/community/posts/{id}`) alongside the
 * GraphQL detail. Deliberately a SEPARATE cache from `["post-detail", id]` so the
 * existing detail query — and every other surface reading it — is untouched.
 *
 * A failure is non-fatal: the caller degrades to "no owner actions / no accept
 * flow" rather than blanking the page.
 *
 * @param postId - the post whose metadata to load (falsy → no request).
 */
export const useQueryPostMetaSwr = (postId: string) => {
    const { data, isLoading, error, mutate } = useSWR<PostMeta>(
        postId ? postMetaKey(postId) : null,
        async () => toPostMeta(await getPost(postId)),
    )
    return { meta: data, isLoading, error, mutate }
}
