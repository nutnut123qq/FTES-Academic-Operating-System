import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { ReactToContentRequest, MutateReactToContentResponse } from "./types"

const mutation1 = gql`
  mutation ReactToContent($request: ReactToContentRequest!) {
    reactToContent(request: $request) {
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

/** Variant selector for {@link mutateReactToContent}. */
export enum MutationReactToContent {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationReactToContent, DocumentNode> = {
    [MutationReactToContent.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateReactToContent}. */
export type MutateReactToContentParams = MutateParams<MutationReactToContent, ReactToContentRequest>

/** Sets/changes/removes the current user's reaction on a content. */
export const mutateReactToContent = async ({
    mutation = MutationReactToContent.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateReactToContentParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.mutate<MutateReactToContentResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
