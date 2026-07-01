import type { GraphQLResponse } from "../../types"
import type { QueryMyContributionDayData } from "./my-dashboard"

/** Variables for the `userContributionCalendar` query. */
export interface QueryUserContributionCalendarRequest {
    /** Id of the user whose contribution calendar to fetch. */
    userId: string
    /** Calendar year to read; omit for the current year. */
    year?: number
}

/**
 * Apollo response shape for `userContributionCalendar`. Reuses
 * {@link QueryMyContributionDayData} — same per-day shape as
 * `myContributionCalendar`; the days are the profile owner's activity.
 */
export interface QueryUserContributionCalendarResponse {
    /** Top-level `userContributionCalendar` field wrapping the standard API response. */
    userContributionCalendar: GraphQLResponse<Array<QueryMyContributionDayData>>
}
