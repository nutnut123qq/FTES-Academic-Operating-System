import { createAuthApolloClient } from "../clients"
import {
    type QueryParams,
} from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryCvUrlResponse } from "./types"

const query1 = gql`
  query CvUrl {
    cvUrl {
      success
      message
      error
      data {
        id
        status
        cvUrl
        cvUrlExpiresInSeconds
        detailFeedback
        score
        submittedAt
      }
    }
  }
`

export enum QueryCvUrl {
    Query1 = "query1",
}

const queryMap: Record<QueryCvUrl, DocumentNode> = {
    [QueryCvUrl.Query1]: query1,
}

/**
 * Fetches presigned CV view URL for the authenticated user (Keycloak bearer).
 */
export const queryCvUrl = async ({
    query = QueryCvUrl.Query1,
    debug,
    signal,
    headers,
}: QueryParams<QueryCvUrl, undefined>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
        headers
    })

    return apollo.query<QueryCvUrlResponse>({
        query: queryMap[query],
    })
}
