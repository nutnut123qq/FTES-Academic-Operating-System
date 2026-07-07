"use client"

import useSWR from "swr"
import { getSubjectWorkspace } from "@/modules/api/rest/subject/subject"

/** A related career path entry. */
export interface RelatedCareer {
    id: string
    title: string
    /** Demand label key suffix (`high` | `medium` | `low`). */
    demand: "high" | "medium" | "low"
}

/** Career-bridge payload for a subject (§21), from the real BE workspace aggregate. */
export interface SubjectCareer {
    skills: Array<string>
    careers: Array<RelatedCareer>
    /**
     * The suggested next subject, or `null` when the BE lists none. Real data:
     * `careerBridge.nextSubjects[0]` (e.g. PRF192 → PRO192).
     */
    nextSubject: { code: string; name: string } | null
}

/**
 * Loads a subject's career bridge from the real BE workspace aggregate
 * (`GET /api/v1/subjects/{code}/workspace` → `careerBridge`). `relatedSkills` and
 * `nextSubjects` are BE-backed; `relatedCareers` is a bare string list on the BE with
 * no demand facet, so a neutral `medium` demand is used as a placeholder label (the
 * list is empty today). Skills/careers degrade to empty when the BE lists none.
 */
export const useQuerySubjectCareerSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        code ? (["subject-career", code] as const) : null,
        async (): Promise<SubjectCareer> => {
            const ws = await getSubjectWorkspace(code)
            const bridge = ws.careerBridge.data
            const next = bridge?.nextSubjects?.[0]
            return {
                skills: bridge?.relatedSkills ?? [],
                careers: (bridge?.relatedCareers ?? []).map((title, index) => ({
                    id: `career-${index}`,
                    title,
                    demand: "medium" as const,
                })),
                nextSubject: next ? { code: next.code, name: next.name } : null,
            }
        },
    )
    return { career: data, isLoading, error, mutate }
}
