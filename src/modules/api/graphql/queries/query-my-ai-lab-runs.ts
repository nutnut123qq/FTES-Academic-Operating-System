import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyAiLabRunsResponse } from "./types"

const query1 = gql`
  query MyAiLabRuns($playgroundId: ID!) {
    myAiLabRuns(playgroundId: $playgroundId) {
      success
      message
      error
      data {
        id
        playgroundId
        systemPrompt
        userPrompt
        params {
          temperature
          topP
          maxTokens
        }
        model
        provider
        mode
        output
        promptTokens
        completionTokens
        estimatedCostCredits
        status
        errorMessage
        createdAt
      }
    }
  }
`

export enum QueryMyAiLabRuns {
    Query1 = "query1",
}

const queryMap: Record<QueryMyAiLabRuns, DocumentNode> = {
    [QueryMyAiLabRuns.Query1]: query1,
}

/**
 * Lists the viewer's prior AI Lab runs for one playground (run history panel).
 * Resolver takes `playgroundId` as a positional variable.
 *
 * Mirrors `myAiLabRuns` (queries/ai-lab/my-ai-lab-runs.resolver.ts).
 */
export const queryMyAiLabRuns = async ({
    query = QueryMyAiLabRuns.Query1,
    playgroundId,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyAiLabRuns, never>, "request"> & {
    request?: never
    /** Playground id to list runs for. */
    playgroundId: string
}) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyAiLabRunsResponse>({
        query: queryMap[query],
        variables: { playgroundId },
    })
}
