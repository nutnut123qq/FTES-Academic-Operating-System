import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type {
    CreateCommunityPostCommentRequest,
    MutateCreateCommunityPostCommentResponse,
} from "./types/community-comments"

const mutation1 = gql`
  mutation CreateCommunityPostComment($request: CreateCommunityPostCommentRequest!) {
    createCommunityPostComment(request: $request) {
      success
      message
      error
      data {
        id
        body
        isDeleted
        editedAt
        createdAt
        parentCommentId
        author {
          id
          username
          displayName
          avatar
        }
        replyCount
        reactions {
          total
          myReaction
        }
        isFounderAuthor
      }
    }
  }
`

export enum MutationCreateCommunityPostComment {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationCreateCommunityPostComment, DocumentNode> = {
    [MutationCreateCommunityPostComment.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateCreateCommunityPostComment}. */
export type MutateCreateCommunityPostCommentParams = MutateParams<
    MutationCreateCommunityPostComment,
    CreateCommunityPostCommentRequest
>

/**
 * Creates a comment (top-level or reply) on a community post. Mirrors
 * `createCommunityPostComment` (mutations/community/create-community-post-comment).
 */
export const mutateCreateCommunityPostComment = async ({
    mutation = MutationCreateCommunityPostComment.Mutation1,
    request,
    debug,
    signal,
}: MutateCreateCommunityPostCommentParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateCreateCommunityPostCommentResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
