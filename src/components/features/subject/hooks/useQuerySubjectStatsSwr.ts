"use client"

import useSWR from "swr"
import { getSubjectStatistics } from "@/modules/api/rest/subject/subject"

/** A top-ranked student entry. */
export interface TopStudent {
    id: string
    name: string
    score: number
}

/** Subject statistics payload, mapped from the real BE statistics endpoint. */
export interface SubjectStats {
    /** Completion rate as a whole percent (0..100). */
    completionRate: number
    /** Total members of the subject workspace. */
    memberCount: number
    /** Number of curated resources. */
    resourceCount: number
    /** Number of community posts scoped to the subject. */
    postCount: number
    topStudents: Array<TopStudent>
}

/**
 * Loads a subject's statistics from the real BE
 * (`GET /api/v1/subjects/{code}/statistics`). Every figure is BE-backed; the seeded
 * subjects report zeros today (no members/resources/posts), which the metric grid
 * renders honestly. `topStudents` carries only `userId` from the BE (no display
 * name), so the id doubles as the label until a profile join lands — the list is
 * empty today.
 */
export const useQuerySubjectStatsSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        code ? (["subject-stats", code] as const) : null,
        async (): Promise<SubjectStats> => {
            const stats = await getSubjectStatistics(code)
            return {
                completionRate: Number(stats.completionRate ?? 0),
                memberCount: stats.memberCount,
                resourceCount: stats.resourceCount,
                postCount: stats.postCount,
                topStudents: stats.topStudents.map((student) => ({
                    id: student.userId,
                    name: student.userId,
                    score: student.xp,
                })),
            }
        },
    )
    return { stats: data, isLoading, error, mutate }
}
