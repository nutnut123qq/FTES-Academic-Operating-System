import type { BlogCommentResponse } from "@/modules/api/rest/blog"

/**
 * Merge a freshly fetched comment page into the running accumulator, deduplicated
 * by id (a later page — or an updated copy of an already-seen comment — replaces
 * the earlier entry). Returns the SAME map reference when there is nothing to
 * merge so a caller effect keyed on the result does not churn.
 *
 * @param existing - comments accumulated from previously loaded pages.
 * @param incoming - the items of the page that just resolved.
 */
export const mergeComments = (
    existing: Map<string, BlogCommentResponse>,
    incoming: readonly BlogCommentResponse[] | undefined,
): Map<string, BlogCommentResponse> => {
    if (!incoming || incoming.length === 0) {
        return existing
    }
    const next = new Map(existing)
    for (const comment of incoming) {
        next.set(comment.id, comment)
    }
    return next
}

/** How the reader chose to order the thread. */
export type CommentSort = "newest" | "oldest" | "mostLiked"

/** The sort modes offered, in the order the selector shows them. */
export const COMMENT_SORTS: ReadonlyArray<CommentSort> = ["newest", "oldest", "mostLiked"]

/** Epoch ms of a comment's creation; `0` for an unparseable timestamp (sorts last-ish). */
const createdMs = (comment: BlogCommentResponse): number => {
    const parsed = new Date(comment.createdAt).getTime()
    return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * ROOT comments (replies excluded — {@link repliesByParent} nests those), ordered by the
 * reader's chosen {@link CommentSort}.
 *
 * Default is `newest`: the BE returns `createdAt ASC`, so the thread used to open on the
 * oldest comment and a reader had to scroll past everything to reach what was just said
 * (góp ý #20).
 *
 * Every mode falls back to a stable id tie-break so equal timestamps / equal like counts
 * keep a deterministic order across renders.
 *
 * @param map - accumulated comments keyed by id.
 * @param sort - the reader's chosen order (defaults to newest-first).
 */
export const sortComments = (
    map: Map<string, BlogCommentResponse>,
    sort: CommentSort = "newest",
): Array<BlogCommentResponse> =>
    [...map.values()]
        .filter((comment) => !comment.parentId)
        .sort((a, b) => {
            if (sort === "mostLiked" && a.emojiCount !== b.emojiCount) {
                return b.emojiCount - a.emojiCount
            }
            const delta = sort === "oldest"
                ? createdMs(a) - createdMs(b)
                : createdMs(b) - createdMs(a)
            return delta !== 0 ? delta : a.id.localeCompare(b.id)
        })

/**
 * Replies grouped under their parent comment id, each group oldest-first.
 *
 * Replies always read chronologically regardless of the thread's sort: a reply chain is a
 * conversation, and reversing it makes answers precede the questions they answer.
 *
 * A reply whose parent is not in the map (the parent lives on a page not loaded yet) is
 * kept in its group; it simply has nowhere to render until that page arrives.
 *
 * @param map - accumulated comments keyed by id.
 */
export const repliesByParent = (
    map: Map<string, BlogCommentResponse>,
): Map<string, Array<BlogCommentResponse>> => {
    const groups = new Map<string, Array<BlogCommentResponse>>()
    for (const comment of map.values()) {
        if (!comment.parentId) {
            continue
        }
        const group = groups.get(comment.parentId)
        if (group) {
            group.push(comment)
        } else {
            groups.set(comment.parentId, [comment])
        }
    }
    for (const group of groups.values()) {
        group.sort((a, b) => {
            const delta = createdMs(a) - createdMs(b)
            return delta !== 0 ? delta : a.id.localeCompare(b.id)
        })
    }
    return groups
}

/**
 * Whether the current viewer owns a comment (gates the inline edit + delete
 * affordances). Owner = `comment.userId === currentUser.id`; guests (null id)
 * never own anything.
 *
 * @param comment - the comment under consideration.
 * @param currentUserId - the signed-in viewer's id, or `null`/`undefined` for guests.
 */
export const isCommentOwner = (
    comment: Pick<BlogCommentResponse, "userId">,
    currentUserId: string | null | undefined,
): boolean => Boolean(currentUserId) && comment.userId === currentUserId
