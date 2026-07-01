import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type { QueryUserCoursesRequest, QueryUserCoursesResponse } from "./types"

const query1 = gql`
  query UserCourses($userId: ID!) {
    userCourses(userId: $userId) {
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
        isEnrolled
      }
    }
  }
`

export enum QueryUserCourses {
    Query1 = "query1",
}

const queryMap: Record<QueryUserCourses, DocumentNode> = {
    [QueryUserCourses.Query1]: query1,
}

/**
 * Fetches a user's joined courses (with milestone progress) by id.
 *
 * Mirrors `userCourses` (queries/users/user-courses/user-courses.resolver.ts);
 * the list is at `data.userCourses.data`.
 */
export const queryUserCourses = async ({
    query = QueryUserCourses.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserCourses, QueryUserCoursesRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserCoursesResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
        },
    })
}
