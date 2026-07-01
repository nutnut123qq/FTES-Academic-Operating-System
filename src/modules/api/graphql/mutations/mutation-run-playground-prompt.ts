import type { MutateParams } from "../types"
import { createAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { RunPlaygroundPromptInput, MutateRunPlaygroundPromptResponse } from "./types/run-playground-prompt"

const mutation1 = gql`
  mutation RunPlaygroundPrompt($input: RunPlaygroundPromptInput!) {
    runPlaygroundPrompt(input: $input) {
      success
      message
      error
      data {
        runId
        cachedOutput
        status
        remainingRuns
        quotaExhausted
      }
    }
  }
`

export enum MutationRunPlaygroundPrompt {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationRunPlaygroundPrompt, DocumentNode> = {
    [MutationRunPlaygroundPrompt.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateRunPlaygroundPrompt}. */
export type MutateRunPlaygroundPromptParams = MutateParams<
    MutationRunPlaygroundPrompt,
    RunPlaygroundPromptInput
>

/**
 * Starts an AI Lab prompt run. Returns a `runId` (subscribe to `/ai_lab` for the
 * token stream) or, on a cache hit, the inline `cachedOutput` with status `cached`.
 * Backend mutation takes a single `input` arg (not a `request` wrapper).
 *
 * Mirrors backend `mutations/ai-lab/run-playground-prompt`.
 */
export const mutateRunPlaygroundPrompt = async ({
    mutation = MutationRunPlaygroundPrompt.Mutation1,
    request,
    headers,
    debug,
    signal,
}: MutateRunPlaygroundPromptParams) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.mutate<MutateRunPlaygroundPromptResponse>({
        mutation: mutationMap[mutation],
        variables: { input: request },
    })
}
