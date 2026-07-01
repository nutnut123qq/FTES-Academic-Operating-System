import useSWRMutation from "swr/mutation"
import { mutateReactCommunityPostComment } from "@/modules/api/graphql/mutations/mutation-react-community-post-comment"
import { type ReactCommunityPostCommentRequest } from "@/modules/api/graphql/mutations/types/community-comments"

type MutateReactCommunityPostCommentResult =
    Awaited<ReturnType<typeof mutateReactCommunityPostComment>>

/**
 * SWR mutation wrapper for {@link mutateReactCommunityPostComment} (Bearer from
 * Keycloak). Set/change a reaction by passing `type`; remove it with `type: null`.
 */
export const useMutateReactCommunityPostCommentSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateReactCommunityPostCommentResult,
        Error,
        string,
        ReactCommunityPostCommentRequest
    >(
        "MUTATE_REACT_COMMUNITY_POST_COMMENT_SWR",
        async (_key, { arg }) => {
            return mutateReactCommunityPostComment({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
