import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyAiQuotaResponse } from "./types"

const query1 = gql`
  query MyAiQuota {
    myAiQuota {
      success
      message
      error
      data {
        mode
        tier
        credit {
          limit5h
          used5h
          remaining5h
          limitWeek
          usedWeek
          remainingWeek
        }
        window5hResetAt
        windowWeekResetAt
        allowedCategories
        ceil {
          default
          chatbot
          grading
          interview
        }
      }
    }
  }
`

export enum QueryMyAiQuota {
    Query1 = "query1",
}

const queryMap: Record<QueryMyAiQuota, DocumentNode> = {
    [QueryMyAiQuota.Query1]: query1,
}

/**
 * Fetches the current user's AI quota snapshot — a single credit pool (free
 * base + tier) with limit/used/remaining per 5h + weekly window, plus the
 * window reset times.
 *
 * Mirrors `myAiQuota` (queries/ai/my-ai-quota/my-ai-quota.resolver.ts).
 */
export const queryMyAiQuota = async ({
    query = QueryMyAiQuota.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyAiQuota, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyAiQuotaResponse>({
        query: queryMap[query],
    })
}
