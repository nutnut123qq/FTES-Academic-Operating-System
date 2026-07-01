import useSWRMutation from "swr/mutation"
import { mutateCreateCommunityPostComment } from "@/modules/api/graphql/mutations/mutation-create-community-post-comment"
import { type CreateCommunityPostCommentRequest } from "@/modules/api/graphql/mutations/types/community-comments"

type MutateCreateCommunityPostCommentResult =
    Awaited<ReturnType<typeof mutateCreateCommunityPostComment>>

/**
 * SWR mutation wrapper for {@link mutateCreateCommunityPostComment} (Bearer from
 * Keycloak). Creates a comment (top-level or reply) on a community post.
 */
export const useMutateCreateCommunityPostCommentSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateCreateCommunityPostCommentResult,
        Error,
        string,
        CreateCommunityPostCommentRequest
    >(
        "MUTATE_CREATE_COMMUNITY_POST_COMMENT_SWR",
        async (_key, { arg }) => {
            return mutateCreateCommunityPostComment({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
