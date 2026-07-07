"use client"

import useSWR from "swr"
import { getCourses } from "@/modules/api/rest/course"

/**
 * Landing-page platform counters, DERIVED from the public REST catalog.
 *
 * The FTES BE exposes NO `platformStats` GraphQL query (it validation-errors:
 * `Field 'platformStats' in type 'Query' is undefined`), so the strip must not send
 * one. Instead we compute the two figures we can back honestly from the real,
 * public `GET /api/v1/courses` list — the number of published courses and the sum
 * of their enrolled-learner counts. The other legacy figures (total lessons / total
 * badges) have no public source and are intentionally omitted rather than faked; the
 * section hides any stat it can't back.
 */
export interface PlatformStatsData {
    /** Published courses in the public catalog (real: `courses.length`). */
    totalCourses: number
    /** Sum of `totalUser` across published courses — total course enrollments (real). */
    totalEnrollments: number
}

/**
 * Loads public platform counters for the landing stat strip by deriving them from
 * the REST course catalog. Public — works for anonymous viewers, no GraphQL, no auth.
 * On error the caller hides the numeric band rather than rendering zeros.
 */
export const useQueryPlatformStatsSwr = () => {
    const swr = useSWR<PlatformStatsData>(
        ["QUERY_PLATFORM_STATS_SWR"],
        async () => {
            const courses = await getCourses({ size: 200 })
            const totalEnrollments = courses.reduce(
                (sum, course) => sum + (Number(course.totalUser) || 0),
                0,
            )
            return { totalCourses: courses.length, totalEnrollments }
        },
    )
    return swr
}
