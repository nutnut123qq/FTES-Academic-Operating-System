import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { ReactActivityRequest, MutateReactActivityResponse } from "./types/react-activity"

const mutation1 = gql`
  mutation ReactToActivity($request: ReactToActivityRequest!) {
    reactToActivity(request: $request) {
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

export enum MutationReactActivity {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationReactActivity, DocumentNode> = {
    [MutationReactActivity.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateReactActivity}. */
export type MutateReactActivityParams = MutateParams<
    MutationReactActivity,
    ReactActivityRequest
>

/**
 * Sets/changes/removes the current user's reaction on a feed activity.
 *
 * Mirrors `reactToActivity`
 * (mutations/discussion/react-to-activity/react-to-activity.resolver.ts).
 * Reacting to your own activity is rejected server-side.
 */
export const mutateReactActivity = async ({
    mutation = MutationReactActivity.Mutation1,
    request,
    debug,
    signal,
}: MutateReactActivityParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })

    return apollo.mutate<MutateReactActivityResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
