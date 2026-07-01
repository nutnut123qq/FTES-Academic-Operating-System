import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryRecommendedCoursesResponse } from "./types"

const query1 = gql`
  query RecommendedCourses {
    recommendedCourses {
      success
      message
      error
      data {
        items {
          displayId
          title
          description
          thumbnailUrl
          originalPriceVnd
          discountedPriceVnd
          discountPercent
          originalPriceUsd
          discountedPriceUsd
          discountReason
          enrolledCount
        }
      }
    }
  }
`

export enum QueryRecommendedCourses {
    Query1 = "query1",
}

const queryMap: Record<QueryRecommendedCourses, DocumentNode> = {
    [QueryRecommendedCourses.Query1]: query1,
}

/**
 * Fetches the viewer's recommended (not-yet-enrolled) courses, each priced with
 * their engagement-based loyalty discount. Mirrors `recommendedCourses`
 * (queries/courses/recommended-courses).
 */
export const queryRecommendedCourses = async ({
    query = QueryRecommendedCourses.Query1,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryRecommendedCourses, never>, "request"> & { request?: never }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryRecommendedCoursesResponse>({
        query: queryMap[query],
    })
}
