import useSWR from "swr"
import { queryUserContributionCalendar } from "@/modules/api/graphql/queries/query-user-contribution-calendar"
import type { QueryMyContributionDayData } from "@/modules/api/graphql/queries/types/my-dashboard"

/**
 * SWR hook for a user's contribution calendar (active days for one year), by id.
 * Public — works for anonymous viewers. Returns the active days (empty array on
 * absent data); pass a null/undefined userId to disable the fetch. Re-keys on
 * `year` so switching years refetches.
 *
 * @param userId - id of the user whose calendar to read
 * @param year - calendar year to read; omit for the current year
 * @returns the SWR handle (data = array of active contribution days)
 */
export const useQueryUserContributionCalendarSwr = (
    userId: string | null | undefined,
    year?: number,
) => {
    return useSWR<Array<QueryMyContributionDayData>>(
        // no key (→ no request) until we actually have a user id
        userId ? ["QUERY_USER_CONTRIBUTION_CALENDAR_SWR", userId, year ?? "current"] : null,
        async () => {
            const result = await queryUserContributionCalendar({
                request: {
                    userId: userId as string,
                    year,
                },
            })
            // unwrap the standard API envelope; empty list when absent
            return result.data?.userContributionCalendar?.data ?? []
        },
    )
}
