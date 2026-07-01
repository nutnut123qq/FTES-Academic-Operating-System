import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    CourseLeaderboardRequest,
    QueryCourseLeaderboardResponse,
} from "./types"

const query1 = gql`
  query CourseLeaderboard($request: LeaderboardRequest!) {
    courseLeaderboard(request: $request) {
      success
      message
      error
      data {
        courseId
        totalChallenges
        maxPossibleScore
        computedAt
        entries {
          rank
          enrollmentId
          userId
          username
          avatar
          totalScore
          completedChallenges
          lessonsRead
          milestoneProgress
          totalXp
        }
        myRank {
          rank
          totalScore
          completedChallenges
          lessonsRead
          milestoneProgress
          totalXp
        }
      }
    }
  }
`

export enum QueryCourseLeaderboard {
    Query1 = "query1",
}

const queryMap: Record<QueryCourseLeaderboard, DocumentNode> = {
    [QueryCourseLeaderboard.Query1]: query1,
}

/**
 * Per-course leaderboard: top entries ranked by total XP plus the viewer's own
 * standing. Mirrors backend `courseLeaderboard` (queries/challenges/leaderboard).
 */
export const queryCourseLeaderboard = async ({
    query = QueryCourseLeaderboard.Query1,
    request,
    headers,
    debug,
    signal,
}: QueryParams<QueryCourseLeaderboard, CourseLeaderboardRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })

    return apollo.query<QueryCourseLeaderboardResponse>({
        query: queryMap[query],
        variables: {
            request,
        },
    })
}
