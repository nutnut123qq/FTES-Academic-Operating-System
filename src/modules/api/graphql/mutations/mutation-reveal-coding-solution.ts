import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type {
    RevealCodingSolutionRequest,
    MutateRevealCodingSolutionResponse,
} from "./types/reveal-coding-solution"

const mutation1 = gql`
  mutation RevealCodingSolution($request: RevealCodingSolutionRequest!) {
    revealCodingSolution(request: $request) {
      success
      message
      error
      data {
        revealed
        solutions {
          id
          language
          code
        }
      }
    }
  }
`

export enum MutationRevealCodingSolution {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationRevealCodingSolution, DocumentNode> = {
    [MutationRevealCodingSolution.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateRevealCodingSolution}. */
export type MutateRevealCodingSolutionParams = MutateParams<
    MutationRevealCodingSolution,
    RevealCodingSolutionRequest
>

/**
 * Records that the user revealed a problem's reference solution (forfeits its
 * points on a later solve). Mirrors backend `revealCodingSolution`.
 */
export const mutateRevealCodingSolution = async ({
    mutation = MutationRevealCodingSolution.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateRevealCodingSolutionParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateRevealCodingSolutionResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
