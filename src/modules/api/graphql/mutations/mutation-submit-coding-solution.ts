import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type {
    SubmitCodingSolutionRequest,
    MutateSubmitCodingSolutionResponse,
} from "./types/submit-coding-solution"

const mutation1 = gql`
  mutation SubmitCodingSolution($request: SubmitCodingSolutionRequest!) {
    submitCodingSolution(request: $request) {
      success
      message
      error
      data {
        submissionId
        jobId
      }
    }
  }
`

export enum MutationSubmitCodingSolution {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSubmitCodingSolution, DocumentNode> = {
    [MutationSubmitCodingSolution.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSubmitCodingSolution}. */
export type MutateSubmitCodingSolutionParams = MutateParams<
    MutationSubmitCodingSolution,
    SubmitCodingSolutionRequest
>

/**
 * Submits a coding solution for async judging.
 * Mirrors backend `submitCodingSolution` (mutations/coding/submit-coding-solution).
 */
export const mutateSubmitCodingSolution = async ({
    mutation = MutationSubmitCodingSolution.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateSubmitCodingSolutionParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateSubmitCodingSolutionResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
