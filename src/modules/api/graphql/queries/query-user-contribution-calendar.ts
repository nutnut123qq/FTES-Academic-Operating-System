import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryUserContributionCalendarRequest,
    QueryUserContributionCalendarResponse,
} from "./types"

const query1 = gql`
  query UserContributionCalendar($userId: ID!, $year: Int) {
    userContributionCalendar(userId: $userId, year: $year) {
      success
      message
      error
      data {
        date
        contents
        challenges
        milestones
        total
      }
    }
  }
`

export enum QueryUserContributionCalendar {
    Query1 = "query1",
}

const queryMap: Record<QueryUserContributionCalendar, DocumentNode> = {
    [QueryUserContributionCalendar.Query1]: query1,
}

/**
 * Fetches a user's contribution calendar (daily contents/challenges/milestones)
 * for one year, by id. Mirrors `userContributionCalendar`
 * (queries/users/user-contribution-calendar). Omit `request.year` for the current year.
 */
export const queryUserContributionCalendar = async ({
    query = QueryUserContributionCalendar.Query1,
    request,
    debug,
    signal,
}: QueryParams<QueryUserContributionCalendar, QueryUserContributionCalendarRequest>) => {
    const apollo = createAuthApolloClient({
        cache: false,
        debug,
        signal,
    })
    return apollo.query<QueryUserContributionCalendarResponse>({
        query: queryMap[query],
        variables: {
            userId: request?.userId,
            year: request?.year ?? null,
        },
    })
}
