import { createAuthApolloClient } from "../clients"
import {
    SortOrder,
    type QueryParams,
    type SortInput,
} from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    ChallengesListRequest,
    QueryChallengesResponse,
} from "./types"

/** Sort keys for `challenges` list (`ChallengesSortBy`). */
export enum ChallengesSortBy {
    Title = "title",
    SortIndex = "sortIndex",
    CreatedAt = "createdAt",
    UpdatedAt = "updatedAt",
}

const query1 = gql`
  query Challenges($request: ChallengesRequest!) {
    challenges(request: $request) {
      success
      message
      error
      data {
        count
        data {
          id
          title
          description
          score
          difficulty
          sortIndex
          hint
        }
      }
    }
  }
`

export enum QueryChallenges {
    Query1 = "query1",
}

const queryMap: Record<QueryChallenges, DocumentNode> = {
    [QueryChallenges.Query1]: query1,
}

export const defaultChallengesListSorts: Array<SortInput<ChallengesSortBy>> = [
    {
        by: ChallengesSortBy.SortIndex,
        order: SortOrder.Asc,
    },
]

/**
 * Paginated content challenges (`ref/queries/challenges/challenges`).
 */
export const queryChallenges = async ({
    query = QueryChallenges.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryChallenges, ChallengesListRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryChallengesResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
