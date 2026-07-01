import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type {
    ReactCommunityPostCommentRequest,
    MutateReactCommunityPostCommentResponse,
} from "./types/community-comments"

const mutation1 = gql`
  mutation ReactToCommunityPostComment($request: ReactToCommunityPostCommentRequest!) {
    reactToCommunityPostComment(request: $request) {
      success
      message
      error
      data {
        total
        myReaction
      }
    }
  }
`

export enum MutationReactCommunityPostComment {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationReactCommunityPostComment, DocumentNode> = {
    [MutationReactCommunityPostComment.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateReactCommunityPostComment}. */
export type MutateReactCommunityPostCommentParams = MutateParams<
    MutationReactCommunityPostComment,
    ReactCommunityPostCommentRequest
>

/**
 * Sets/changes/removes the current user's reaction on a community post comment.
 * Mirrors `reactToCommunityPostComment`.
 */
export const mutateReactCommunityPostComment = async ({
    mutation = MutationReactCommunityPostComment.Mutation1,
    request,
    debug,
    signal,
}: MutateReactCommunityPostCommentParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateReactCommunityPostCommentResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
