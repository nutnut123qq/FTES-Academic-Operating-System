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

/**
 * Flatten the accumulator into the render list, oldest-first (the BE sorts
 * `createdAt ASC`), with a stable id tie-break so equal timestamps keep a
 * deterministic order across renders.
 *
 * @param map - accumulated comments keyed by id.
 */
export const sortComments = (
    map: Map<string, BlogCommentResponse>,
): Array<BlogCommentResponse> =>
    [...map.values()].sort((a, b) => {
        const delta = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        return delta !== 0 ? delta : a.id.localeCompare(b.id)
    })

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
