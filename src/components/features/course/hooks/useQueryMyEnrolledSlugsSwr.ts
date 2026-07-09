"use client"

import useSWR from "swr"
import { getMyEnrollments } from "@/modules/api/rest/course"
import type { EnrollmentView } from "@/modules/api/rest/course"

/**
 * The slugs of the courses the viewer is ACTIVELY enrolled in, as a `Set` for
 * O(1) membership checks from catalog cards. Loaded once from
 * `GET /courses/me/enrollments` under a shared SWR key (every card reuses the one
 * fetch) and gated on a stored access token: anonymous viewers get an empty set —
 * no 401 spam — so the catalog degrades to the price + "View Course" CTA. A
 * failed request (401/network) also degrades to empty.
 */
export const useQueryMyEnrolledSlugsSwr = () => {
    const hasToken =
        typeof window !== "undefined" &&
        !!window.localStorage.getItem("keycloak:access_token")
    const { data } = useSWR(
        hasToken ? ["course-my-enrolled-slugs"] : null,
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
