import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { ReactToCommentRequest, MutateReactToCommentResponse } from "./types"

const mutation1 = gql`
  mutation ReactToComment($request: ReactToCommentRequest!) {
    reactToComment(request: $request) {
      success
      message
      error
      data {
        total
        myReaction
        counts {
          type
          count
        }
      }
    }
  }
`

/** Variant selector for {@link mutateReactToComment}. */
export enum MutationReactToComment {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationReactToComment, DocumentNode> = {
    [MutationReactToComment.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateReactToComment}. */
export type MutateReactToCommentParams = MutateParams<MutationReactToComment, ReactToCommentRequest>

/** Sets/changes/removes the current user's reaction on a comment. */
export const mutateReactToComment = async ({
    mutation = MutationReactToComment.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateReactToCommentParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.mutate<MutateReactToCommentResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
