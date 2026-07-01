import { createAuthApolloClient } from "../clients"
import { type QueryParams } from "../types"
import { DocumentNode, gql } from "@apollo/client"
import type {
    QueryMyContributionCalendarRequest,
    QueryMyContributionCalendarResponse,
} from "./types"

const query1 = gql`
  query MyContributionCalendar($year: Int) {
    myContributionCalendar(year: $year) {
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

export enum QueryMyContributionCalendar {
    Query1 = "query1",
}

const queryMap: Record<QueryMyContributionCalendar, DocumentNode> = {
    [QueryMyContributionCalendar.Query1]: query1,
}

/**
 * Fetches the viewer's contribution calendar (daily contents/challenges/milestones)
 * for one year. Mirrors `myContributionCalendar` (queries/dashboard/my-contribution-calendar).
 * Omit `request.year` for the current year.
 */
export const queryMyContributionCalendar = async ({
    query = QueryMyContributionCalendar.Query1,
    request,
    headers,
    debug,
    signal,
}: Omit<QueryParams<QueryMyContributionCalendar, never>, "request">
    & { request?: QueryMyContributionCalendarRequest }) => {
    const apollo = createAuthApolloClient({
        cache: false,
        headers,
        debug,
        signal,
    })
    return apollo.query<QueryMyContributionCalendarResponse>({
        query: queryMap[query],
        variables: {
            year: request?.year ?? null,
        },
    })
}
