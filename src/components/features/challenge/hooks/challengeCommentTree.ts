import type {
    ChallengeAuthorView,
    ChallengeCommentPage,
    ChallengeCommentView,
} from "@/modules/api/rest/challenges/types"

/** Comment status the BE stamps on a soft-deleted (tombstoned) challenge comment. */
export const CHALLENGE_COMMENT_DELETED = "DELETED"

/**
 * Builds the placeholder node shown while a challenge comment write is in flight.
 *
 * The node keeps the BE shape ({@link ChallengeCommentView}) so the renderer needs no
 * "is this optimistic?" branch, and it is SIGNED: the author card is filled from the
 * viewer's own session card, so the comment shows the writer's name and avatar the instant
 * it appears and does not change identity when {@link replaceChallengeComment} swaps in the
 * stored row. The temporary id is swapped for the server's as soon as the POST resolves.
 *
 * The card used to be left `null` here, on the rule "a profile card is a server fact, do not
 * guess it". That rule is right for an ARBITRARY author and wrong for this one: the author
 * IS the viewer, the server will echo back that same account, and the fields come from the
 * profile the session was hydrated from — so there is nothing for the BE to disagree with,
 * while the anonymous row everybody saw for the length of a round-trip was a real,
 * reported regression ("my comment shows up without my name or my photo"). Do NOT put the
 * `null` back.
 *
 * @param content - The comment body as typed.
 * @param parentId - Parent comment id when replying; `null`/omitted for a root comment.
 * @param viewerId - The signed-in viewer's id, so the row renders as their own.
 * @param viewer - The viewer's author card
 *   (`useViewerAuthorCard`). `null`/omitted — guest, or a session that has not hydrated —
 *   degrades to the old id-only row rather than to a half-filled identity.
 * @returns A `ChallengeCommentView`-shaped placeholder carrying a temporary id.
 */
export const buildOptimisticChallengeComment = (
    content: string,
    parentId: string | null | undefined,
    viewerId: string | null | undefined,
    viewer?: ChallengeAuthorView | null,
): ChallengeCommentView => ({
    id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    authorId: viewer?.userId ?? viewerId ?? null,
    author: viewer ?? null,
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
export const patchChallengeComment = (
    page: ChallengeCommentPage,
    commentId: string,
    patch: (comment: ChallengeCommentView) => ChallengeCommentView,
): ChallengeCommentPage => ({
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
 * Roots are prepended (the BE lists them newest-first) and replies are appended to their
 * parent's `replies` (listed oldest-first). A reply whose parent is not on this page is
 * dropped rather than promoted to a root — showing it as a top-level comment would
 * misrepresent the thread until the refetch lands.
 *
 * @param page - The cached page (returned untouched when the parent is missing).
 * @param comment - The node to insert; `parentId` decides root vs reply.
 * @returns The page with the node inserted, or the original page.
 */
export const insertChallengeComment = (
    page: ChallengeCommentPage,
    comment: ChallengeCommentView,
): ChallengeCommentPage => {
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

    // `total` counts ROOTS only (what the pager pages over), so a reply never bumps it.
    return attached ? { ...page, items } : page
}

/**
 * Swaps a placeholder node for the row the BE actually stored — real id, server
 * `createdAt`, the resolved author card, and the root the BE re-parented the reply onto.
 *
 * The IDENTITY is expected to be a no-op across this swap: the placeholder was already
 * signed with the viewer's own card ({@link buildOptimisticChallengeComment}) and the server
 * resolves that same account, so nothing visible about who wrote the comment changes here.
 *
 * @param page - The cached page holding the placeholder.
 * @param optimisticId - Id created by {@link buildOptimisticChallengeComment}.
 * @param saved - The `ChallengeCommentView` returned by the POST.
 * @returns The page with the placeholder replaced.
 */
export const replaceChallengeComment = (
    page: ChallengeCommentPage,
    optimisticId: string,
    saved: ChallengeCommentView,
): ChallengeCommentPage =>
    patchChallengeComment(page, optimisticId, (placeholder) => ({
        ...saved,
        // Keep the replies already rendered under the placeholder root.
        replies: saved.replies.length > 0 ? saved.replies : placeholder.replies,
    }))

/**
 * Marks a comment as the tombstone the BE will persist (soft delete keeps the row and its
 * replies, so the thread never collapses under a deleted parent). The author is dropped
 * here too, exactly as the server does it — a deleted comment stops naming who wrote it.
 *
 * The BODY is left to the BE: the refetch that follows the delete swaps in the real
 * tombstone text, and inventing one here would risk showing a string the server never
 * wrote.
 *
 * @param page - The cached page.
 * @param commentId - The comment being deleted.
 * @returns The page with that row tombstoned.
 */
export const tombstoneChallengeComment = (
    page: ChallengeCommentPage,
    commentId: string,
): ChallengeCommentPage =>
    patchChallengeComment(page, commentId, (comment) => ({
        ...comment,
        authorId: null,
        author: null,
        status: CHALLENGE_COMMENT_DELETED,
    }))
