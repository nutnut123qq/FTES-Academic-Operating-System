"use client"

import useSWR from "swr"
import { listResources } from "@/modules/api/rest/resource"

import { useQuerySubjectSwr } from "./useQuerySubjectSwr"

/**
 * A pickable AI source — one REAL resource of the subject. `id` is the resource
 * UUID the AI job body sends as `resourceId` (BE `AiInputGuard.requireResourceAccess`
 * re-checks it is APPROVED + readable before the job is enqueued), so this list must
 * never carry a synthetic id.
 */
export interface SubjectAiResourceSource {
    /** Resource UUID — sent verbatim as the job's `resourceId`. */
    id: string
    /** Display title. */
    title: string
    /** BE resource type (PDF/SLIDE/…), shown as a hint. */
    type: string
}

/** Page size for the picker — the whole subject's catalog fits well under this. */
const SOURCE_PAGE_SIZE = 50

/**
 * Loads the subject's resources as AI job sources from the REAL Resource Hub
 * (`GET /api/v1/resources?subjectId={uuid}`).
 *
 * Two ids are in play and mixing them yields an empty list: the `[subjectId]` route
 * segment is the subject CODE (`PRF192`), while `/resources` filters on the subject
 * UUID. The code→UUID hop goes through {@link useQuerySubjectSwr} (SWR-cached, so the
 * subject detail is fetched once per workspace and shared with the header).
 *
 * @param subjectId - the `[subjectId]` route segment (a subject code).
 */
export const useQuerySubjectAiResourceSourcesSwr = (subjectId: string) => {
    const { subject, isLoading: isSubjectLoading } = useQuerySubjectSwr(subjectId)
    const subjectUuid = subject?.uuid

    const { data, isLoading, error, mutate } = useSWR(
        subjectUuid ? (["subject-ai-resource-sources", subjectUuid] as const) : null,
        async ([, uuid]): Promise<Array<SubjectAiResourceSource>> => {
            const page = await listResources({
                subjectId: uuid,
                page: 0,
                size: SOURCE_PAGE_SIZE,
            })
            return (page.items ?? []).map((item) => ({
                id: item.id,
                title: item.title,
                type: item.type,
            }))
        },
    )

    return {
        sources: data ?? [],
        isLoading: isSubjectLoading || isLoading,
        error,
        mutate,
    }
}
