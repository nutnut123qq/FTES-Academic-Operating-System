"use client"

import useSWR from "swr"
import {
    getMyCourseAccess,
    type CourseAccessStateView,
} from "@/modules/api/rest/course"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's course access state. */
export const COURSE_ACCESS_SWR_KEY = "COURSE_ACCESS_SWR"

/**
 * Builds the SWR key tuple for a course's access state, keyed on the VIEWER ID and the
 * course UUID (`course.rawId`). `null` disables the fetch — pass `undefined` for the
 * course until the detail has loaded, or when the caller has no token / already knows
 * the flag; a null `viewerId` (guest, or the `me` query still in flight) disables it too.
 *
 * Import this builder at any call site that needs to `mutate` the entry — never
 * hand-write the tuple, or the mutate stops matching the key the hook reads under.
 */
export const courseAccessKey = (
    viewerId: string | null,
    courseRawId: string | undefined,
) =>
    viewerId && courseRawId
        ? ([COURSE_ACCESS_SWR_KEY, viewerId, courseRawId] as const)
        : null

/**
 * SWR query wrapper for {@link getMyCourseAccess}. Reads `{enrolled, purchased,
 * fullAccess}` for the caller on a course. Gated on `courseRawId` (the course
 * UUID); a 401/404 degrades to `null` rather than throwing, so callers using it
 * as a purchase-flag fallback simply keep the flag false. `shouldRetryOnError:
 * false` avoids retrying an auth/not-found error.
 *
 * The key also carries the VIEWER ID. The course UUID names the COURSE, not the buyer,
 * so on the old `[prefix, courseRawId]` key one entry held whoever asked first: sign out
 * of a purchaser and into a fresh account in the same tab and the new viewer is handed
 * `fullAccess: true` from the cache — the paywall and the challenge-attempt cap both key
 * off this flag, so the leak unlocks paid content client-side, not merely mis-labels it.
 */
export const useGetMyCourseAccessSwr = (courseRawId: string | undefined) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    return useSWR<CourseAccessStateView | null, Error>(
        authenticated ? courseAccessKey(viewerId, courseRawId) : null,
        () => getMyCourseAccess(courseRawId as string).catch(() => null),
        { shouldRetryOnError: false },
    )
}
