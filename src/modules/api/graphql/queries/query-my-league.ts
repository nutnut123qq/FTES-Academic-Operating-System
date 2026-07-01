import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyLeagueResponse } from "./types"

const query1 = gql`
  query MyLeague {
    myLeague {
      success
      message
      error
      data {
        tier
        weekEndAt
        promoteCount
        demoteCount
        entries {
          userGlobalId
          username
          avatar
          weekPoints
          rank
          rankDelta
        }
      }
    }
  }
`

export enum QueryMyLeague {
    Query1 = "query1",
}

const queryMap: Record<QueryMyLeague, DocumentNode> = {
    [QueryMyLeague.Query1]: query1,
}

/**
 * Fetches the viewer's weekly-league standing (tier + ranked cohort).
 * Mirrors `myLeague` (queries/league/my-league).
 */
export const queryMyLeague = async ({
    query = QueryMyLeague.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyLeague, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyLeagueResponse>({
        query: queryMap[query],
    })
}
