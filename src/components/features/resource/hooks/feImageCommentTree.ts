import type { FeImageCommentPage, FeImageCommentView } from "@/modules/api/rest/resource"

/** Comment status the BE stamps on a soft-deleted (tombstoned) FE image comment. */
export const FE_IMAGE_COMMENT_DELETED = "DELETED"

/**
 * Builds the placeholder node shown while a per-image comment write is in flight.
 *
 * The node keeps the BE shape ({@link FeImageCommentView}) so the renderer needs no
 * "is this optimistic?" branch, and the temporary id is swapped for the server's as soon as
 * the POST resolves.
 *
 * NO author card is filled in here — and none is missing either: this view has no author
 * field at all, on the placeholder OR on the stored row. `userId` is the whole identity the
 * BE ships, so a placeholder carrying the viewer's id is byte-for-byte as identified as the
 * row that replaces it. Naming the WRITER (their display name, handle and photo) is
 * therefore the renderer's job, not this builder's: `FeImageCommentThread`'s mapper matches
 * `userId` against the session card, which lands the identity on the placeholder and on the
 * server row alike — the only arrangement in which the comment cannot change identity
 * mid-swap. Do not "fix" this by inventing an author field the contract does not have.
 *
 * @param imageId - The album image the comment belongs to.
 * @param content - The comment body as typed.
 * @param parentId - Parent comment id when replying; `null`/omitted for a root comment.
 * @param viewerId - The signed-in viewer's id, so the row renders as their own.
 * @returns A `FeImageCommentView`-shaped placeholder carrying a temporary id.
 */
export const buildOptimisticFeImageComment = (
    imageId: string,
    content: string,
    parentId: string | null | undefined,
    viewerId: string | null | undefined,
): FeImageCommentView => ({
    id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    imageId,
    userId: viewerId ?? null,
    parentId: parentId ?? null,
    content,
    status: "VISIBLE",
    createdAt: new Date().toISOString(),
    replies: [],
})

/**
 * Rewrites ONE comment anywhere in a cached page — root or one-level reply — leaving
 * every other node (and the ordering) untouched.
 *
 * @param page - The cached page.
 * @param commentId - Id of the node to rewrite; a page without it comes back unchanged.
 * @param patch - Maps the matched node onto its replacement.
 * @returns A new page with the single node replaced.
 */
export const patchFeImageComment = (
    page: FeImageCommentPage,
    commentId: string,
    patch: (comment: FeImageCommentView) => FeImageCommentView,
): FeImageCommentPage => ({
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
            replies: root.replies.map((reply) =>
                reply.id === commentId ? patch(reply) : reply,
            ),
        }
    }),
})

/**
 * Inserts a comment into a cached page, keeping the BE's nested shape.
 *
 * Roots are prepended (the BE lists them newest-first) and replies are appended to
 * their parent's `replies` (listed ascending). A reply whose parent is not on this page
 * is dropped rather than promoted to a root — showing it as a top-level comment would
 * misrepresent the thread until the refetch lands.
 *
 * @param page - The cached page (returned untouched when the parent is missing).
 * @param comment - The node to insert; `parentId` decides root vs reply.
 * @returns The page with the node inserted, or the original page.
 */
export const insertFeImageComment = (
    page: FeImageCommentPage,
    comment: FeImageCommentView,
): FeImageCommentPage => {
    if (!comment.parentId) {
        return { ...page, items: [comment, ...page.items], total: page.total + 1 }
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

    // `total` counts ROOTS only — the BE builds the page from
    // `findByImageIdAndParentIdIsNull...` and reports `roots.getTotalElements()`, which is
    // also what the pager pages over. Bumping it for a REPLY drifted the "Bình luận ảnh
    // này (n)" heading upward on every reply and could invent a page that does not exist.
    return attached ? { ...page, items } : page
}

/**
 * Swaps a placeholder node for the row the BE actually stored (real id, server
 * `createdAt`, and the root the BE re-parented the reply onto).
 *
 * @param page - The cached page holding the placeholder.
 * @param optimisticId - Id created by {@link buildOptimisticFeImageComment}.
 * @param saved - The `FeImageCommentView` returned by the POST.
 * @returns The page with the placeholder replaced.
 */
export const replaceFeImageComment = (
    page: FeImageCommentPage,
    optimisticId: string,
    saved: FeImageCommentView,
): FeImageCommentPage =>
    patchFeImageComment(page, optimisticId, (placeholder) => ({
        ...saved,
        // Keep the replies already rendered under the placeholder root.
        replies: saved.replies.length > 0 ? saved.replies : placeholder.replies,
    }))

/**
 * Marks a comment as the tombstone the BE will persist (soft delete keeps the row and
 * its replies, so the thread never collapses under a deleted parent).
 *
 * The body is left to the BE: the refetch that follows the delete swaps in the real
 * tombstone text, and inventing one here would risk showing a string the server never
 * wrote.
 *
 * @param page - The cached page.
 * @param commentId - The comment being deleted.
 * @returns The page with that row tombstoned.
 */
export const tombstoneFeImageComment = (
    page: FeImageCommentPage,
    commentId: string,
): FeImageCommentPage =>
    patchFeImageComment(page, commentId, (comment) => ({
        ...comment,
        userId: null,
        status: FE_IMAGE_COMMENT_DELETED,
    }))
