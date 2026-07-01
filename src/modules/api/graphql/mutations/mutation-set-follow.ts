import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SetFollowRequest, MutateSetFollowResponse } from "./types/set-follow"

const mutation1 = gql`
  mutation SetFollow($request: SetFollowRequest!) {
    setFollow(request: $request) {
      success
      message
      error
    }
  }
`

export enum MutationSetFollow {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSetFollow, DocumentNode> = {
    [MutationSetFollow.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSetFollow}. */
export type MutateSetFollowParams = MutateParams<
    MutationSetFollow,
    SetFollowRequest
>

/**
 * Follows or unfollows another user (idempotent toggle).
 *
 * Mirrors `setFollow` (mutations/follows/set-follow/set-follow.resolver.ts).
 */
export const mutateSetFollow = async ({
    mutation = MutationSetFollow.Mutation1,
    request,
    debug,
    signal,
}: MutateSetFollowParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateSetFollowResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
