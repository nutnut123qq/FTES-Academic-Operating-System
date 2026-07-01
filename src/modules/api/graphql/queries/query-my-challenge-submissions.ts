import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryMyChallengeSubmissionsRequest,
    QueryMyChallengeSubmissionsResponse,
} from "./types"

const query1 = gql`
  query MyChallengeSubmissions($limit: Int, $offset: Int) {
    myChallengeSubmissions(limit: $limit, offset: $offset) {
      success
      message
      error
      data {
        items {
          id
          challengeTitle
          courseTitle
          courseGlobalId
          status
          score
          selectedLang
          submissionUrl
          submittedAt
        }
        total
      }
    }
  }
`

export enum QueryMyChallengeSubmissions {
    Query1 = "query1",
}

const queryMap: Record<QueryMyChallengeSubmissions, DocumentNode> = {
    [QueryMyChallengeSubmissions.Query1]: query1,
}

/**
 * Fetches a page of the viewer's challenge submissions (newest first).
 *
 * Mirrors `myChallengeSubmissions` — plain paginated list, returns
 * `data.myChallengeSubmissions.data` = `{ items, total }`.
 */
export const queryMyChallengeSubmissions = async ({
    query = QueryMyChallengeSubmissions.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryMyChallengeSubmissions, QueryMyChallengeSubmissionsRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryMyChallengeSubmissionsResponse>({
        query: queryMap[query],
        variables: {
            limit: request?.limit,
            offset: request?.offset,
        },
    })
}
