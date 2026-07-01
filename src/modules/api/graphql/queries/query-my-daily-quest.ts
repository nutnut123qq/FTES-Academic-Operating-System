import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyDailyQuestResponse } from "./types"

const query1 = gql`
  query MyDailyQuest {
    myDailyQuest {
      success
      message
      error
      data {
        date
        tasks {
          key
          current
          target
        }
        allDone
        claimed
        reward
      }
    }
  }
`

export enum QueryMyDailyQuest {
    Query1 = "query1",
}

const queryMap: Record<QueryMyDailyQuest, DocumentNode> = {
    [QueryMyDailyQuest.Query1]: query1,
}

/**
 * Fetches the viewer's daily quest for today (per-task progress + claim state).
 * Mirrors `myDailyQuest` (queries/dashboard/my-daily-quest).
 */
export const queryMyDailyQuest = async ({
    query = QueryMyDailyQuest.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyDailyQuest, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyDailyQuestResponse>({
        query: queryMap[query],
    })
}
