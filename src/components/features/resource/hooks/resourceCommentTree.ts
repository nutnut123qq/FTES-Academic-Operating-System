import type {
    ResourceCommentLikeResponse,
    ResourceCommentView,
    ResourceCommentsPage,
} from "@/modules/api/rest/resource"

/** Comment status the BE stamps on a soft-deleted (tombstoned) comment. */
export const RESOURCE_COMMENT_DELETED = "DELETED"

/**
 * Builds the placeholder node shown while a comment write is in flight.
 *
 * The node keeps the BE shape ({@link ResourceCommentView}) so the renderer needs no
 * "is this optimistic?" branch: the author is derived from `userId` exactly like a real
 * row (the C-4 view carries NO author card, so nothing is invented client-side), and the
 * temporary id is swapped for the server's as soon as the POST resolves.
 *
 * @param content - The comment body as typed.
 * @param parentId - Parent comment id when replying; `null`/omitted for a root comment.
 * @param viewerId - The signed-in viewer's id, so the row renders as "you".
 */
export const buildOptimisticResourceComment = (
    content: string,
    parentId: string | null | undefined,
    viewerId: string | null | undefined,
): ResourceCommentView => ({
    id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: viewerId ?? null,
    parentId: parentId ?? null,
    content,
    status: "VISIBLE",
    createdAt: new Date().toISOString(),
    // A brand-new comment has no likes yet; declaring them keeps the placeholder shaped
    // exactly like a BE row so the heart renders without an "is this optimistic?" branch.
    likeCount: 0,
    likedByMe: false,
    replies: [],
})

/**
 * Rewrites ONE comment anywhere in a cached page — root or one-level reply — leaving every
 * other node (and the ordering) untouched.
 *
 * @param page - The cached page.
 * @param commentId - Id of the node to rewrite; a page without it comes back unchanged.
 * @param patch - Maps the matched node onto its replacement.
 */
export const patchResourceComment = (
    page: ResourceCommentsPage,
    commentId: string,
    patch: (comment: ResourceCommentView) => ResourceCommentView,
): ResourceCommentsPage => ({
    ...page,
    items: page.items.map((root) => {
        if (root.id === commentId) {
            return patch(root)
        }
        if (!root.replies.some((reply) => reply.id === commentId)) {
            return root
        }
        return {
            ...root,
            replies: root.replies.map((reply) => (reply.id === commentId ? patch(reply) : reply)),
        }
    }),
})

/**
 * Inserts a comment into a cached page, keeping the BE's nested shape.
 *
 * Roots are prepended (the BE lists them `createdAt DESC`, so a new one belongs at the
 * top) and replies are appended to their parent's `replies` (listed ascending). A reply
 * whose parent is not on this page is dropped rather than promoted to a root — showing it
 * as a top-level comment would misrepresent the thread until the refetch lands.
 *
 * @param page - The cached page (returned untouched when the parent is missing).
 * @param comment - The node to insert; `parentId` decides root vs reply.
 */
export const insertResourceComment = (
    page: ResourceCommentsPage,
    comment: ResourceCommentView,
): ResourceCommentsPage => {
    if (!comment.parentId) {
        return {
            ...page,
            items: [comment, ...page.items],
            total: page.total + 1,
        }
    }

    const parentId = comment.parentId
    let attached = false
    const items = page.items.map((root) => {
        // The BE re-parents a reply-of-reply onto the root, so a reply can also arrive
        // pointing at a nested row — match either.
        const isParent =
            root.id === parentId || root.replies.some((reply) => reply.id === parentId)
        if (!isParent) {
            return root
        }
        attached = true
        return { ...root, replies: [...root.replies, comment] }
    })

    // `total` counts ROOTS only (`ResourceCommentService` reports
    // `roots.getTotalElements()` off the parent-is-null query), so a reply must not bump
    // it — the same over-count the FE-album sibling carried.
    return attached ? { ...page, items } : page
}

/**
 * Swaps a placeholder node for the row the BE actually stored (real id, server
 * `createdAt`, and the root the BE re-parented the reply onto).
 *
 * @param page - The cached page holding the placeholder.
 * @param optimisticId - Id of the node created by {@link buildOptimisticResourceComment}.
 * @param saved - The `ResourceCommentView` returned by the POST.
 */
export const replaceResourceComment = (
    page: ResourceCommentsPage,
    optimisticId: string,
    saved: ResourceCommentView,
): ResourceCommentsPage =>
    patchResourceComment(page, optimisticId, (placeholder) => ({
        ...saved,
        // Keep the replies already rendered under the placeholder root.
        replies: saved.replies.length > 0 ? saved.replies : placeholder.replies,
    }))

/**
 * Flips the viewer's like on one comment and moves the counter by exactly one.
 *
 * The counter NEVER comes from a client-side recount — the BE ships `likeCount` on every
 * row — this only nudges the number the server already sent so the heart reacts instantly.
 * A no-op when the comment is already in the requested state, which makes the function safe
 * to apply twice (the optimistic paint and the rollback both go through it) and matches the
 * idempotent `PUT`/`DELETE .../like` endpoints.
 *
 * @param comment - The comment as currently cached.
 * @param nextLiked - The state the viewer is moving to.
 */
export const toggleResourceCommentLike = (
    comment: ResourceCommentView,
    nextLiked: boolean,
): ResourceCommentView => {
    if ((comment.likedByMe ?? false) === nextLiked) {
        return comment
    }
    return {
        ...comment,
        likedByMe: nextLiked,
        likeCount: Math.max(0, (comment.likeCount ?? 0) + (nextLiked ? 1 : -1)),
    }
}

/**
 * Overwrites a comment's like state with what the server just answered
 * (`{active, likeCount}`), which is authoritative — it accounts for likes other people
 * landed while the request was in flight.
 *
 * @param comment - The comment as currently cached.
 * @param result - The `PUT`/`DELETE .../like` response.
 */
export const applyResourceCommentLikeResult = (
    comment: ResourceCommentView,
    result: ResourceCommentLikeResponse,
): ResourceCommentView => ({
    ...comment,
    likedByMe: result.active,
    likeCount: result.likeCount,
})

/**
 * Marks a comment as the tombstone the BE will persist (soft delete keeps the row and its
 * replies, so the thread never collapses under a deleted parent).
 *
 * @param page - The cached page.
 * @param commentId - The comment being deleted.
 */
export const tombstoneResourceComment = (
    page: ResourceCommentsPage,
    commentId: string,
): ResourceCommentsPage =>
    // The spread keeps `replies`, so the thread under a deleted parent survives.
    patchResourceComment(page, commentId, (comment) => ({
        ...comment,
        userId: null,
        status: RESOURCE_COMMENT_DELETED,
    }))
