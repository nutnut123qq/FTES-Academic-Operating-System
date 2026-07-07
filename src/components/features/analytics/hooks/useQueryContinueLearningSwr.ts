"use client"

import useSWR from "swr"
import { getMyEnrollments } from "@/modules/api/rest/course"

/** Kind of resume target — drives the chip icon + label. */
export type ResumeKind = "challenge" | "lesson"

/**
 * One "pick up where you left off" resume item — a course the learner is enrolled
 * in but hasn't finished.
 */
export interface ResumeItem {
    /** Stable id. */
    id: string
    /** Title to show. */
    label: string
    /** Challenge vs lesson (chip styling + kind caption). */
    kind: ResumeKind
    /** Destination when the learner presses "Continue". */
    href: string
}

/** Max number of resume cards shown. */
export const RESUME_LIMIT = 3

/**
 * Loads the viewer's continue-learning resume items from the real course
 * enrollments (`GET /courses/me/enrollments`) + a `hasCourses` flag so the widget
 * can show onboarding instead of an empty void. Unfinished courses lead (lowest
 * completion first); the destination is each course's learn shell.
 */
export const useQueryContinueLearningSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(
        ["analytics", "overview", "continue"],
        async (): Promise<Array<ResumeItem>> => {
            const enrollments = await getMyEnrollments()
            return enrollments
                .filter((enrollment) => enrollment.active)
                .slice()
                .sort((a, b) => Number(a.completionPercent ?? 0) - Number(b.completionPercent ?? 0))
                .map((enrollment) => ({
                    id: enrollment.courseId,
                    label: enrollment.courseTitle,
                    kind: "lesson" as const,
                    href: `/courses/${enrollment.slugName}/learn`,
                }))
        },
    )
    return {
        resumeItems: (data ?? []).slice(0, RESUME_LIMIT),
        hasCourses: (data ?? []).length > 0,
        isLoading,
        error,
        mutate,
    }
}
