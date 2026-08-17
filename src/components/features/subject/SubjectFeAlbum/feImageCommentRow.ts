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
 * The FE-image comment view carries NO author card — only a `userId` — so for SOMEBODY ELSE
 * nothing about the author is invented: `authorUsername` is set to that raw id, which is
 * exactly the degradation `PostCommentThread` documents (its owner gate compares the viewer
 * id too, and its row prints the shared "member" label instead of a uuid). A tombstoned row
 * gets an EMPTY author id on purpose: it must never match the viewer, so the ⋯ menu offers
 * nothing on a comment that is already deleted.
 *
 * The READER'S OWN rows are the exception, and they are named. `userId` identifies them
 * unambiguously, and their name / handle / photo are already in the session card — so a
 * person's own comment stops being signed "thành viên" under a stranger's generated face,
 * which is the whole complaint this mapper answers.
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
    return {
        id: comment.id,
        author: mine ? viewerAuthorName(mine, "") : (comment.userId ?? ""),
        authorUsername: isDeleted ? "" : (mine?.username ?? comment.userId ?? ""),
        authorAvatar: mine?.avatarUrl ?? null,
        text: comment.content,
        timeLabel: formatRelativeTime(comment.createdAt, locale),
        replies: (comment.replies ?? []).map((reply) =>
            toFeImagePostComment(reply, locale, viewer),
        ),
    }
}
