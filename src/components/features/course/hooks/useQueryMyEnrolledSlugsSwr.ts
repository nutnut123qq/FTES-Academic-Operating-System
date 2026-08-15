"use client"

import useSWR from "swr"
import { getMyEnrollments } from "@/modules/api/rest/course"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import type { EnrollmentView } from "@/modules/api/rest/course"

/**
 * The slugs of the courses the viewer is ACTIVELY enrolled in, as a `Set` for
 * O(1) membership checks from catalog cards. Loaded once from
 * `GET /courses/me/enrollments` under a shared SWR key (every card reuses the one
 * fetch) and gated on the REACTIVE session flag `state.keycloak.authenticated`:
 * signed-out viewers get an empty set — no 401 spam — so the catalog degrades to
 * the price + "View Course" CTA. A failed request (401/network) also degrades to
 * empty.
 *
 * The gate MUST come from redux, not from a `localStorage` read taken during render:
 * local storage is not reactive, so signing in without a page load left this hook on
 * its null key forever and every catalog card kept its "not enrolled" CTA until the
 * user pressed F5.
 *
 * "Shared" means shared between CARDS, not between ACCOUNTS: the key carries the viewer
 * id ({@link useViewerScopeId}), so signing out of A and into B in the same tab cannot
 * hand B the enrolled-slug set still cached for A.
 */
export const useQueryMyEnrolledSlugsSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const { data } = useSWR(
        authenticated && viewerId ? ["course-my-enrolled-slugs", viewerId] : null,
        async () => {
            const enrollments = await getMyEnrollments().catch(
                () => [] as Array<EnrollmentView>,
            )
            return new Set(
                enrollments.filter((e) => e.active).map((e) => e.slugName),
            )
        },
    )
    return { enrolledSlugs: data ?? new Set<string>() }
}
