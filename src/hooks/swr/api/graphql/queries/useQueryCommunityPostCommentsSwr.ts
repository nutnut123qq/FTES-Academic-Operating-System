import useSWR from "swr"
import { queryCommunityPostComments } from "@/modules/api/graphql/queries/query-community-post-comments"

/** Page size for the comment list. */
const PAGE_LIMIT = 50

/**
 * SWR hook for a community post's comments. Open to everyone (feed + comments are
 * publicly readable). Pass `parentCommentId` to load that comment's replies, or
 * null/omit for top-level comments. Keyed by `(postId, parentCommentId)` so each
 * thread + reply list is cached independently. Pass `enabled=false` to skip
 * fetching until the list is actually opened.
 *
 * @param postId - the post whose comments to load
 * @param parentCommentId - parent to load replies of, or null for top-level
 * @param enabled - whether to fetch (skip until expanded)
 * @returns the SWR handle (data = { comments, total }, isLoading, error, mutate)
 */
export const useQueryCommunityPostCommentsSwr = (
    postId: string,
    parentCommentId: string | null = null,
    enabled = true,
) => {
    return useSWR(
        // null key disables the request until the list is opened
        enabled ? ["QUERY_COMMUNITY_POST_COMMENTS_SWR", postId, parentCommentId ?? "root"] : null,
        async ([, id]) => {
            const data = await queryCommunityPostComments({
                request: {
                    postId: id,
                    // omit for top-level; a value lists that parent's replies
                    parentCommentId: parentCommentId ?? undefined,
                    limit: PAGE_LIMIT,
                },
            })
            if (!data || !data.data) {
                throw new Error("Failed to fetch comments")
            }
            return data.data.communityPostComments?.data ?? { comments: [], total: 0 }
        },
    )
}
