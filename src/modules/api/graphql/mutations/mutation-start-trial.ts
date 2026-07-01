import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { StartTrialRequest, MutateStartTrialResponse } from "./types/start-trial"

const mutation1 = gql`
  mutation StartTrial($request: StartTrialRequest!) {
    startTrial(request: $request) {
      success
      message
      error
      data {
        isEnrolled
      }
    }
  }
`

export enum MutationStartTrial {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationStartTrial, DocumentNode> = {
    [MutationStartTrial.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateStartTrial}. */
export type MutateStartTrialParams = MutateParams<MutationStartTrial, StartTrialRequest>

/**
 * Starts a trial (preview) enrollment for a course — the "Học thử" flow.
 * Idempotent server-side: a no-op when any enrollment already exists.
 *
 * Mirrors `startTrial` (mutations/courses/start-trial).
 */
export const mutateStartTrial = async ({
    mutation = MutationStartTrial.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateStartTrialParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.mutate<MutateStartTrialResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
