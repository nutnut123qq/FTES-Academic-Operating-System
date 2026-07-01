import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { CreateCommentRequest, MutateCreateCommentResponse } from "./types"

const mutation1 = gql`
  mutation CreateComment($request: CreateCommentRequest!) {
    createComment(request: $request) {
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

/** Variant selector for {@link mutateCreateComment}. */
export enum MutationCreateComment {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationCreateComment, DocumentNode> = {
    [MutationCreateComment.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateCreateComment}. */
export type MutateCreateCommentParams = MutateParams<MutationCreateComment, CreateCommentRequest>

/** Creates a comment (top-level or reply) on a content. */
export const mutateCreateComment = async ({
    mutation = MutationCreateComment.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateCreateCommentParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.mutate<MutateCreateCommentResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
