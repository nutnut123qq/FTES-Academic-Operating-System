import type { ResourceCommentView, ResourceCommentsPage } from "@/modules/api/rest/resource"

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
    replies: [],
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

    return attached ? { ...page, items, total: page.total + 1 } : page
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
): ResourceCommentsPage => ({
    ...page,
    items: page.items.map((root) => {
        if (root.id === optimisticId) {
            // Keep the replies already rendered under the placeholder root.
            return { ...saved, replies: saved.replies.length > 0 ? saved.replies : root.replies }
        }
        if (!root.replies.some((reply) => reply.id === optimisticId)) {
            return root
        }
        return {
            ...root,
            replies: root.replies.map((reply) => (reply.id === optimisticId ? saved : reply)),
        }
    }),
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
): ResourceCommentsPage => {
    const tombstone = (comment: ResourceCommentView): ResourceCommentView => ({
        ...comment,
        userId: null,
        status: RESOURCE_COMMENT_DELETED,
    })

    return {
        ...page,
        items: page.items.map((root) => {
            if (root.id === commentId) {
                return { ...tombstone(root), replies: root.replies }
            }
            if (!root.replies.some((reply) => reply.id === commentId)) {
                return root
            }
            return {
                ...root,
                replies: root.replies.map((reply) =>
                    reply.id === commentId ? tombstone(reply) : reply,
                ),
            }
        }),
    }
}
