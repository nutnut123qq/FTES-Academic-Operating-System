"use client"

import useSWR from "swr"
import { getCampuses } from "@/modules/api/rest/community"
import type { CampusView } from "@/modules/api/rest/community"

/** SWR key shared by every campus reader so `GET /community/campuses` is fetched once. */
export const CAMPUSES_SWR_KEY = ["community", "campuses"] as const

/**
 * Loads the admin-managed ACTIVE campus list from the real BE
 * (`GET /api/v1/community/campuses`) for the composer + profile-edit campus pickers.
 *
 * This is reference data: cached under a shared key (no focus/reconnect revalidation)
 * and degraded to an EMPTY list on error, so a failed fetch simply leaves the pickers
 * with no options rather than surfacing an error.
 */
export const useQueryCampusesSwr = (): {
    campuses: Array<CampusView>
    isLoading: boolean
    error: unknown
} => {
    const { data, isLoading, error } = useSWR(CAMPUSES_SWR_KEY, getCampuses, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    })
    return { campuses: data ?? [], isLoading, error }
}
