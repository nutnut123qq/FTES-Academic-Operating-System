"use client"

import useSWR from "swr"
import {
    getCourseDetail,
    getCourseProgress,
    getMyCertificates,
} from "@/modules/api/rest/course"

/** Course progress + completion for the progress page (§4). */
export interface CourseProgress {
    completedLessons: number
    totalLessons: number
    percent: number
    certificateAvailable: boolean
    /** Verify code of the earned certificate — null until one is issued. */
    certificateCode: string | null
}

/**
 * Loads a course's real progress. The route param is the course displayId/slug,
 * so the public detail is fetched first to resolve the raw course id (same as
 * the learn hooks), which also yields the lesson total. The viewer's per-lesson
 * rows come from `GET /courses/{id}/me/progress`; at 100% the auto-issued
 * certificate is looked up so the CTA can deep-link to its verify page
 * (fail-soft — a missing certificate only hides the CTA).
 */
export const useQueryCourseProgressSwr = (courseId: string) => {
    const { data, isLoading, error } = useSWR(
        courseId ? ["GET_COURSE_PROGRESS_PAGE", courseId] : null,
        async (): Promise<CourseProgress> => {
            const detail = await getCourseDetail(courseId)
            const realId = detail.course?.id ?? courseId
            const totalLessons = (detail.sections ?? []).reduce(
                (sum, section) => sum + (section.lessons?.length ?? 0),
                0,
            )
            const progress = await getCourseProgress(realId)
            const completedLessons = (progress.lessons ?? []).filter(
                (row) => row.status === "COMPLETED",
            ).length
            const percent = Math.round(Number(progress.completionPercent ?? "0"))
            const certificateAvailable = percent >= 100
            let certificateCode: string | null = null
            if (certificateAvailable) {
                const certificates = await getMyCertificates().catch(() => [])
                certificateCode =
                    certificates.find(
                        (certificate) => certificate.courseId === realId && certificate.active,
                    )?.certificateCode ?? null
            }
            return {
                completedLessons,
                totalLessons,
                percent,
                certificateAvailable,
                certificateCode,
            }
        },
        { shouldRetryOnError: false },
    )
    return { progress: data, isLoading, error }
}
