import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryMyCoursesResponse } from "./types"

const query1 = gql`
  query MyCourses {
    myCourses {
      success
      message
      error
      data {
        globalId
        label
        thumbnailUrl
        contentCompleted
        contentTotal
        challengeCompleted
        challengeTotal
        completed
        total
        completionPercent
        isEnrolled
      }
    }
  }
`

export enum QueryMyCourses {
    Query1 = "query1",
}

const queryMap: Record<QueryMyCourses, DocumentNode> = {
    [QueryMyCourses.Query1]: query1,
}

/**
 * Fetches every joined course with its milestone progress (rail list).
 *
 * Mirrors `myCourses` (queries/dashboard/my-courses).
 */
export const queryMyCourses = async ({
    query = QueryMyCourses.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyCourses, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyCoursesResponse>({
        query: queryMap[query],
    })
}
