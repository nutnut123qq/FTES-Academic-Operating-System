import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { ReactCommunityPostRequest, MutateReactCommunityPostResponse } from "./types/community"

const mutation1 = gql`
  mutation ReactToCommunityPost($request: ReactToCommunityPostRequest!) {
    reactToCommunityPost(request: $request) {
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

export enum MutationReactCommunityPost {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationReactCommunityPost, DocumentNode> = {
    [MutationReactCommunityPost.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateReactCommunityPost}. */
export type MutateReactCommunityPostParams = MutateParams<
    MutationReactCommunityPost,
    ReactCommunityPostRequest
>

/**
 * Sets/changes/removes the current user's reaction on a community post. Mirrors
 * `reactToCommunityPost` (mutations/community/react-to-community-post).
 */
export const mutateReactCommunityPost = async ({
    mutation = MutationReactCommunityPost.Mutation1,
    request,
    debug,
    signal,
}: MutateReactCommunityPostParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateReactCommunityPostResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
