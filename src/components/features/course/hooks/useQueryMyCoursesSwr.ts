"use client"

import useSWR from "swr"
import { getMyEnrollments } from "@/modules/api/rest/course"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import type { EnrollmentView } from "@/modules/api/rest/course"

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
    /**
     * Course cover image URL, or `null` when the course has none / the BE build
     * doesn't send it yet. The continue-learning card renders a framed thumbnail
     * when set and an empty framed surface when null (graceful degrade).
     */
    coverImage: string | null
    /**
     * ISO-8601 instant this enrollment's term-bound access ENDS, or `null` when access
     * is permanent (the course is not part of a term / older BE build). When set (and
     * not {@link expired}) the card shows a "mở đến {date}" badge.
     */
    accessUntil: string | null
    /**
     * True when this enrollment's access was revoked because its term ended (the student
     * was kicked). Drives the "đăng ký lại" affordance on the card — the card still links
     * into the course, where the full re-buy CTA lives.
     */
    expired: boolean
}

/**
 * Defensive publish gate for a "continue learning" enrollment row.
 *
 * The paired BE change (home-continue-image-and-mascot) excludes UNPUBLISHED
 * courses from `GET /courses/me/enrollments` at the source AND stamps each row
 * with the course publish status, so unpublished courses never reach the client.
 * Until every deployment carries that change we also filter here. The gate is
 * deliberately permissive: a row counts as published UNLESS the BE positively
 * says otherwise, so a build that doesn't yet send the flag (or already
 * pre-filtered) keeps showing every active enrollment — a missing field never
 * blanks the band.
 */
const isPublishedEnrollment = (enrollment: EnrollmentView): boolean => {
    if (typeof enrollment.published === "boolean") return enrollment.published
    if (typeof enrollment.status === "string") {
        return enrollment.status.trim().toUpperCase() === "PUBLISHED"
    }
    return true
}

/**
 * The viewer's ACTIVE course enrollments as resumable cards (title + progress +
 * learn href), reusing the shared `GET /courses/me/enrollments` fetcher. Least-
 * finished courses lead so "continue learning" surfaces the next thing to do.
 * Gated on the REACTIVE session flag `state.keycloak.authenticated` (mirrors
 * {@link useQueryMyEnrolledSlugsSwr} and the app-shell viewer query) so anonymous
 * viewers get an empty list — no 401 spam, and the home band can self-hide. While
 * signed out the SWR key is null, so the fetch never runs, `isLoading` stays false
 * and callers fall through to the empty / hidden branch.
 *
 * The gate MUST come from redux, not from a `localStorage` read taken during render:
 * local storage is not reactive, so a sign-in that happens without a page load wrote
 * the token but never re-rendered this hook — the key stayed null, the fetch never
 * ran, and the "continue learning" band stayed empty until the user pressed F5.
 * Every sign-in path dispatches `setAuthenticated(true)`, which re-renders every
 * subscriber, so keying off it is what makes the band appear on sign-in.
 *
 * The key also carries the VIEWER ID ({@link useViewerScopeId}). "Somebody is signed
 * in" is not an identity: on the bare key, signing out of A and into B in the same tab
 * re-keys to the same entry and B reads A's enrollments straight from the cache.
 */
export const useQueryMyCoursesSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const { data, isLoading, error, mutate } = useSWR(
        authenticated && viewerId ? ["course-my-courses", viewerId] : null,
        async (): Promise<Array<MyCourse>> => {
            const enrollments = await getMyEnrollments()
            return enrollments
                // (active OR term-expired) AND (defensively) a published course. An
                // unpublished course must never surface in continue-learning; a
                // term-expired enrollment stays visible so the viewer can re-enroll.
                .filter(
                    (enrollment) =>
                        (enrollment.active || enrollment.expired === true) &&
                        isPublishedEnrollment(enrollment),
                )
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
                    coverImage: enrollment.imageHeader ?? null,
                    accessUntil: enrollment.accessUntil ?? null,
                    expired: enrollment.expired === true,
                }))
        },
    )
    return {
        courses: data ?? [],
        hasCourses: (data ?? []).length > 0,
        // Anonymous (null key) never "loads": SWR leaves data undefined with
        // isLoading false, so the page shows the empty state and the home band hides.
        isLoading: authenticated && isLoading,
        error,
        mutate,
    }
}
