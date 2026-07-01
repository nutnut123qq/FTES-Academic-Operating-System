import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SubmitPersonalProjectIdealRequest, MutateSubmitPersonalProjectIdealResponse } from "./types/submit-personal-project-ideal"

const mutation1 = gql`
  mutation SubmitPersonalProjectIdeal($request: SubmitPersonalProjectIdealRequest!) {
    submitPersonalProjectIdeal(request: $request) {
      success
      message
      error
      data {
        id
      }
    }
  }
`

export enum MutationSubmitPersonalProjectIdeal {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSubmitPersonalProjectIdeal, DocumentNode> = {
    [MutationSubmitPersonalProjectIdeal.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSubmitPersonalProjectIdeal}. */
export type MutateSubmitPersonalProjectIdealParams = MutateParams<
    MutationSubmitPersonalProjectIdeal,
    SubmitPersonalProjectIdealRequest
>

/**
 * Saves project idea text for a specific enrollment.
 */
export const mutateSubmitPersonalProjectIdeal = async ({
    mutation = MutationSubmitPersonalProjectIdeal.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateSubmitPersonalProjectIdealParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateSubmitPersonalProjectIdealResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
