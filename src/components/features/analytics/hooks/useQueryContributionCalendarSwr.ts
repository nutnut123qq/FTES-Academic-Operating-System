"use client"

import useSWR from "swr"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import { useAppSelector } from "@/redux/hooks"
import type { QueryMyContributionDayData } from "@/modules/api/graphql/queries/types/my-dashboard"

// ponytail: mock BE — no contribution-calendar endpoint yet. Deterministically
// seeds a scattering of active days across the requested year so the GitHub-style
// heatmap has something to render; SWR-shaped for a drop-in swap later.
const fetchContributionCalendarMock = async (
    year: number,
): Promise<Array<QueryMyContributionDayData>> => {
    const days: Array<QueryMyContributionDayData> = []
    // walk every day of the year; a cheap deterministic hash decides activity
    const cursor = new Date(Date.UTC(year, 0, 1))
    const end = new Date(Date.UTC(year, 11, 31))
    while (cursor <= end) {
        const dayOfYear = Math.floor(
            (cursor.getTime() - Date.UTC(year, 0, 1)) / 86_400_000,
        )
        // pseudo-random but stable: ~40% of days active, with a small burst
        const seed = (dayOfYear * 2654435761) % 97
        if (seed < 39) {
            const contents = seed % 4
            const challenges = seed % 3
            const milestones = seed % 2
            const total = contents + challenges + milestones
            if (total > 0) {
                days.push({
                    date: cursor.toISOString().slice(0, 10),
                    contents,
                    challenges,
                    milestones,
                    total,
                })
            }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
    return days
}

/**
 * Loads the viewer's contribution calendar for a given year. Mocked; SWR-shaped.
 *
 * The key carries the VIEWER ID ({@link useViewerScopeId}) and doubles as the fetch
 * gate, matching the real endpoint this swaps to: a contribution heatmap is the
 * viewer's own activity, so the cache entry must be per-account from day one.
 */
export const useQueryContributionCalendarSwr = (year: number) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const { data, isLoading, error, mutate } = useSWR(
        authenticated && viewerId
            ? ["analytics", "overview", "contributions", year, viewerId]
            : null,
        () => fetchContributionCalendarMock(year),
    )
    return { data, isLoading, error, mutate }
}
