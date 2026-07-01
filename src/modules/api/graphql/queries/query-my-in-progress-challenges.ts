import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyInProgressChallengesResponse } from "./types"

const query1 = gql`
  query MyInProgressChallenges {
    myInProgressChallenges {
      success
      message
      error
      data {
        globalId
        label
      }
    }
  }
`

export enum QueryMyInProgressChallenges {
    Query1 = "query1",
}

const queryMap: Record<QueryMyInProgressChallenges, DocumentNode> = {
    [QueryMyInProgressChallenges.Query1]: query1,
}

/**
 * Fetches the challenges the viewer has started but not yet passed (rail list).
 *
 * Mirrors `myInProgressChallenges` (queries/dashboard/my-in-progress-challenges).
 */
export const queryMyInProgressChallenges = async ({
    query = QueryMyInProgressChallenges.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyInProgressChallenges, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyInProgressChallengesResponse>({
        query: queryMap[query],
    })
}
