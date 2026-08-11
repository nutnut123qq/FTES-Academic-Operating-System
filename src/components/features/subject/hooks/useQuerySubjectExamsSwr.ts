"use client"

import useSWR from "swr"
import { listResources, type ResourceSummary } from "@/modules/api/rest/resource"
import { getSubjectDetail } from "@/modules/api/rest/subject/subject"

/** The two exam flavours a subject's Practice tab lists. */
export type SubjectExamKind = "pe" | "fe"

/** FE facet → the backend `ResourceType` name `GET /resources?type=` accepts. */
export const BE_EXAM_TYPE: Record<SubjectExamKind, string> = {
    pe: "PE",
    fe: "FE",
}

/** Route segment of each exam kind under `/subjects/{id}/practice`. */
export const EXAM_ROUTE_SEGMENT: Record<SubjectExamKind, string> = {
    pe: "pe",
    fe: "fe",
}

/** One PE paper / FE album row in the Practice tab's exam list. */
export interface SubjectExam {
    /** Real resource UUID — routes to the PE/FE detail page. */
    id: string
    title: string
    /** Average rating, or `null` when nobody has rated it yet. */
    rating: number | null
    /** Number of ratings behind {@link rating}. */
    ratingCount: number
    /** ISO creation timestamp, or `null` when the BE omits it. */
    createdAt: string | null
    /** Raw BE visibility value (e.g. `PUBLIC` | `ENROLLED_ONLY`). */
    visibility: string
    /**
     * Server-computed lock (CONTRACT B): `true` when the exam is purchasers-only and
     * the viewer has not purchased the linked course. Defaults `false` so a deployment
     * predating the contract keeps every row open.
     */
    lockedForViewer: boolean
}

/** Maps a BE list row onto the FE {@link SubjectExam}. */
const toExam = (summary: ResourceSummary): SubjectExam => ({
    id: summary.id,
    title: summary.title,
    rating: typeof summary.avgRating === "number" ? summary.avgRating : null,
    ratingCount: summary.ratingCount ?? 0,
    createdAt: summary.createdAt ?? null,
    visibility: summary.visibility ?? "",
    lockedForViewer: summary.lockedForViewer === true,
})

/** How many exams one page of the list holds. */
const EXAM_PAGE_SIZE = 50

/**
 * Loads the subject's PE papers or FE albums from the real resource module.
 *
 * `GET /api/v1/resources?subjectId=&type=PE|FE` is now the ONLY path that returns these
 * two types (they were removed from the Resource-tab taxonomy), and the BE keys the
 * filter on the subject **UUID** while the route segment is the subject **code** — so
 * the subject detail is resolved first (`GET /subjects/{code}`) and its `id` passed
 * through. The resolved UUID comes back with the list because the contribute + moderation
 * surfaces need it too (creating a resource takes the UUID, not the code).
 *
 * @param subjectId - the `[subjectId]` route segment (a subject code).
 * @param kind - `"pe"` (exam papers) or `"fe"` (image albums).
 * @returns `exams`, the resolved `subjectUuid`, and the SWR state/`mutate`.
 */
export const useQuerySubjectExamsSwr = (subjectId: string, kind: SubjectExamKind) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, isValidating, error, mutate } = useSWR(
        code ? (["subject-exams", code, kind] as const) : null,
        async (): Promise<{ subjectUuid: string; exams: Array<SubjectExam> }> => {
            const detail = await getSubjectDetail(code)
            const page = await listResources({
                subjectId: detail.id,
                type: BE_EXAM_TYPE[kind],
                size: EXAM_PAGE_SIZE,
            })
            return {
                subjectUuid: detail.id,
                exams: (page?.items ?? []).map(toExam),
            }
        },
        { keepPreviousData: true },
    )

    return {
        exams: data?.exams ?? [],
        subjectUuid: data?.subjectUuid ?? null,
        isLoading,
        isValidating,
        error,
        mutate,
    }
}
