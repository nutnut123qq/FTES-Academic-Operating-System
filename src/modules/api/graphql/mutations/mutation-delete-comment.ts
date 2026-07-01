import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { DeleteCommentRequest, MutateDeleteCommentResponse } from "./types"

const mutation1 = gql`
  mutation DeleteComment($request: DeleteCommentRequest!) {
    deleteComment(request: $request) {
      success
      message
      error
      data {
        id
      }
    }
  }
`

/** Variant selector for {@link mutateDeleteComment}. */
export enum MutationDeleteComment {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationDeleteComment, DocumentNode> = {
    [MutationDeleteComment.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateDeleteComment}. */
export type MutateDeleteCommentParams = MutateParams<MutationDeleteComment, DeleteCommentRequest>

/** Soft-deletes a comment (author only). */
export const mutateDeleteComment = async ({
    mutation = MutationDeleteComment.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateDeleteCommentParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.mutate<MutateDeleteCommentResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
