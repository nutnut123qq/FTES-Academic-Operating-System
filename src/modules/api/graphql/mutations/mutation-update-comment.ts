import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { UpdateCommentRequest, MutateUpdateCommentResponse } from "./types"

const mutation1 = gql`
  mutation UpdateComment($request: UpdateCommentRequest!) {
    updateComment(request: $request) {
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
        replyCount
        author {
          id
          username
          avatar
        }
        reactions {
          total
          myReaction
          counts {
            type
            count
          }
        }
      }
    }
  }
`

/** Variant selector for {@link mutateUpdateComment}. */
export enum MutationUpdateComment {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationUpdateComment, DocumentNode> = {
    [MutationUpdateComment.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateUpdateComment}. */
export type MutateUpdateCommentParams = MutateParams<MutationUpdateComment, UpdateCommentRequest>

/** Edits a comment's body (author only). */
export const mutateUpdateComment = async ({
    mutation = MutationUpdateComment.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateUpdateCommentParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.mutate<MutateUpdateCommentResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
