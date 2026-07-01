import useSWR from "swr"
import { queryMyContributionCalendar } from "@/modules/api/graphql/queries/query-my-contribution-calendar"
import type { QueryMyContributionDayData } from "@/modules/api/graphql/queries/types/my-dashboard"
import { useAppSelector } from "@/redux/hooks"

/**
 * SWR wrapper for {@link queryMyContributionCalendar}. `data` is the viewer's
 * active contribution days for the given year (oldest first), or `[]`. User-scoped
 * — only runs once authenticated. Re-keys on `year` so switching years refetches.
 * @param year - calendar year to read; omit for the current year.
 */
export const useQueryMyContributionCalendarSwr = (year?: number) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<Array<QueryMyContributionDayData>>(
        authenticated ? ["QUERY_MY_CONTRIBUTION_CALENDAR_SWR", year ?? "current"] : null,
        async () => {
            // unwrap the standard API envelope; empty list when absent
            const result = await queryMyContributionCalendar({
                request: year != null ? {
                    year,
                } : undefined,
            })
            return result.data?.myContributionCalendar?.data ?? []
        },
    )
}
