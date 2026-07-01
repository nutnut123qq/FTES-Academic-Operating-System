import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyUpcomingLivestreamsResponse } from "./types"

const query1 = gql`
  query MyUpcomingLivestreams {
    myUpcomingLivestreams {
      success
      message
      error
      data {
        courseGlobalId
        courseTitle
        courseDisplayId
        sessionTitle
        nextStartAt
        nextEndAt
      }
    }
  }
`

export enum QueryMyUpcomingLivestreams {
    Query1 = "query1",
}

const queryMap: Record<QueryMyUpcomingLivestreams, DocumentNode> = {
    [QueryMyUpcomingLivestreams.Query1]: query1,
}

/**
 * Fetches the viewer's upcoming livestream sessions across enrolled courses
 * (soonest first). Mirrors `myUpcomingLivestreams`
 * (queries/dashboard/my-upcoming-livestreams); the backend caps the list via its
 * `limit` default.
 */
export const queryMyUpcomingLivestreams = async ({
    query = QueryMyUpcomingLivestreams.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyUpcomingLivestreams, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyUpcomingLivestreamsResponse>({
        query: queryMap[query],
    })
}
