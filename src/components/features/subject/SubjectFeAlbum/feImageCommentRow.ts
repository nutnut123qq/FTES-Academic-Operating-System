import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import { FE_IMAGE_COMMENT_DELETED } from "@/components/features/resource/hooks/feImageCommentTree"
import {
    viewerAuthorName,
    viewerOwnRowCard,
    type ViewerAuthorCard,
} from "@/hooks/useViewerAuthorCard"
import type { FeImageCommentView } from "@/modules/api/rest/resource"
import type { PostComment } from "@/components/features/community/hooks/useQueryPostDetailSwr"

/**
 * Adapts ONE FE-album comment onto the shared {@link PostComment} contract.
 *
 * Three sources of a name, tried in this order, and the order is the point:
 *
 * 1. **The BE's author card** (`comment.author`, shipped by `fe-album-author-cards`) — the
 *    only one that can name SOMEBODY ELSE, so it wins whenever it is there.
 * 2. **The reader's own session card**, for the reader's own rows. Still needed after (1)
 *    exists: it names the optimistic row a POST has not come back for yet, and it keeps the
 *    thread readable against a backend that predates the card.
 * 3. **Nothing.** `authorUsername` falls back to the raw `userId`, which is exactly the
 *    degradation `PostCommentThread` documents — its row prints the shared "member" label
 *    rather than a uuid, and its owner gate still compares the viewer id.
 *
 * Never invent a name to fill (3). A row the server could not attribute must read as
 * unattributed; printing a plausible name is the bug this whole change removes.
 *
 * A tombstoned row gets an EMPTY author id on purpose: it must never match the viewer, so
 * the ⋯ menu offers nothing on a comment that is already deleted.
 *
 * Naming happens HERE and not in the optimistic insert, on purpose: the placeholder and the
 * stored row it is swapped for carry the same `userId`, so a rule applied at render time
 * lands on both — and a comment that is named the same before and after the round-trip
 * cannot visibly re-identify itself. Filling an author into the placeholder INSTEAD would
 * put a name on a row whose replacement has none, i.e. re-create the flicker in reverse.
 *
 * Split out of the component so the rule can be unit-tested without rendering a thread.
 *
 * @param comment - The BE row.
 * @param locale - Active locale, for the relative timestamp.
 * @param viewer - The reader's own author card, or `null` (guest / unhydrated session) to
 *   keep every row on the id-only degradation.
 * @returns The row in the shape every thread surface renders.
 */
export const toFeImagePostComment = (
    comment: FeImageCommentView,
    locale: string,
    viewer: ViewerAuthorCard | null,
): PostComment => {
    const isDeleted = comment.status === FE_IMAGE_COMMENT_DELETED || comment.userId === null
    const mine = viewerOwnRowCard(viewer, comment.userId, isDeleted)
    // A tombstone drops the card with the id: a deleted comment names nobody.
    const card = isDeleted ? null : (comment.author ?? null)
    return {
        id: comment.id,
        author: card
            ? (card.displayName ?? card.username ?? "")
            : mine
                ? viewerAuthorName(mine, "")
                : (comment.userId ?? ""),
        authorUsername: isDeleted
            ? ""
            : (card?.username ?? mine?.username ?? comment.userId ?? ""),
        authorAvatar: card?.avatarUrl ?? mine?.avatarUrl ?? null,
        text: comment.content,
        timeLabel: formatRelativeTime(comment.createdAt, locale),
        replies: (comment.replies ?? []).map((reply) =>
            toFeImagePostComment(reply, locale, viewer),
        ),
    }
}
