import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryAiModelsResponse } from "./types"

/** Cost/quality category of a model (mirrors backend `AiModelCategory`). */
export enum AiModelCategory {
    Free = "free",
    Economy = "economy",
    Balanced = "balanced",
    Premium = "premium",
    Frontier = "frontier",
}

const query1 = gql`
  query AiModels {
    aiModels {
      success
      message
      error
      data {
        tier
        models {
          taskKind
          label
          description
          activeModel {
            model
            provider
          }
          fallbackChain {
            model
            provider
          }
        }
        gradableModels {
          model
          provider
          category
          complimentary
          available
        }
      }
    }
  }
`

export enum QueryAiModels {
    Query1 = "query1",
}

const queryMap: Record<QueryAiModels, DocumentNode> = {
    [QueryAiModels.Query1]: query1,
}

export const queryAiModels = async ({
    query = QueryAiModels.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryAiModels, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryAiModelsResponse>({
        query: queryMap[query],
    })
}
