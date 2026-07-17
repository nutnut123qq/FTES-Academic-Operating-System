"use client"

import useSWR from "swr"
import { getMyEnrollments } from "@/modules/api/rest/course"

/** One enrolled course the viewer can resume — title + rounded progress + learn href. */
export interface MyCourse {
    /** Stable course id. */
    courseId: string
    /** Course title. */
    title: string
    /** Route slug — the learn shell keys on it. */
    slug: string
    /** Completion 0–100, rounded + clamped. */
    completionPercent: number
    /** Destination — the course learn shell. */
    href: string
    /** True for a PAID enrollment (bought a package) — drives the Enrolled vs Trial badge. */
    isPurchased: boolean
}

/**
 * The viewer's ACTIVE course enrollments as resumable cards (title + progress +
 * learn href), reusing the shared `GET /courses/me/enrollments` fetcher. Least-
 * finished courses lead so "continue learning" surfaces the next thing to do.
 * Gated on a stored access token (mirrors {@link useQueryMyEnrolledSlugsSwr}) so
 * anonymous viewers get an empty list — no 401 spam, and the home band can
 * self-hide without a layout jump. With no token the SWR key is null, so the
 * fetch never runs, `isLoading` stays false and callers fall through to the
 * empty / hidden branch.
 */
export const useQueryMyCoursesSwr = () => {
    const hasToken =
        typeof window !== "undefined" &&
        !!window.localStorage.getItem("keycloak:access_token")
    const { data, isLoading, error, mutate } = useSWR(
        hasToken ? ["course-my-courses"] : null,
        async (): Promise<Array<MyCourse>> => {
            const enrollments = await getMyEnrollments()
            return enrollments
                .filter((enrollment) => enrollment.active)
                .slice()
                .sort(
                    (a, b) =>
                        Number(a.completionPercent ?? 0) - Number(b.completionPercent ?? 0),
                )
                .map((enrollment) => ({
                    courseId: enrollment.courseId,
                    title: enrollment.courseTitle,
                    slug: enrollment.slugName,
                    completionPercent: Math.max(
                        0,
                        Math.min(100, Math.round(Number(enrollment.completionPercent ?? 0))),
                    ),
                    href: `/courses/${enrollment.slugName}/learn`,
                    isPurchased: Boolean(enrollment.isPurchased),
                }))
        },
    )
    return {
        courses: data ?? [],
        hasCourses: (data ?? []).length > 0,
        // Anonymous (null key) never "loads": SWR leaves data undefined with
        // isLoading false, so the page shows the empty state and the home band hides.
        isLoading: hasToken && isLoading,
        error,
        mutate,
    }
}
