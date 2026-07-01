import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { RequestToTeamRequest, MutateRequestToTeamResponse } from "./types/request-to-team"

const mutation1 = gql`
  mutation RequestToTeam($request: RequestToTeamRequest!) {
    requestToTeam(request: $request) {
      success
      message
      error
      data {
        requested
        jobId
      }
    }
  }
`

export enum MutationRequestToTeam {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationRequestToTeam, DocumentNode> = {
    [MutationRequestToTeam.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateRequestToTeam}. */
export type MutateRequestToTeamParams = MutateParams<
    MutationRequestToTeam,
    RequestToTeamRequest
>

/**
 * Request to join the GitHub team mapped to an enrolled course (enqueues the
 * resolve-github invite). Separate from linking the GitHub identity.
 *
 * Mirrors backend `request-to-team`.
 */
export const mutateRequestToTeam = async ({
    mutation = MutationRequestToTeam.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateRequestToTeamParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateRequestToTeamResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
