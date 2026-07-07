"use client"

import useSWR from "swr"
import { getSubjectWorkspace } from "@/modules/api/rest/subject/subject"

/** Resource type — mirrors §5 Resource Hub types. */
export type ResourceType = "pdf" | "slide" | "video" | "pe" | "fe" | "source" | "notes"

/** A single resource in a subject's Resource tab. */
export interface SubjectResource {
    id: string
    title: string
    type: ResourceType
    /** Human size label, e.g. "2.4 MB". */
    sizeLabel: string
    /** Human updated label, e.g. "3 ngày trước". */
    updatedLabel: string
}

/** A grouping of resources (§5 Collections / Learning Pack). */
export interface SubjectCollection {
    id: string
    title: string
    count: number
}

/**
 * Loads a subject's resources from the real BE workspace aggregate
 * (`GET /api/v1/subjects/{code}/workspace` → `resources`). The workspace resource
 * links carry only `{id, title}` (no type/size/updated facet), so those degrade to a
 * neutral `notes` type + empty labels. The seeded subjects have no resources yet, so
 * the tab renders its empty state. Collections have no BE source and stay empty.
 */
export const useQuerySubjectResourcesSwr = (subjectId: string) => {
    const code = subjectId ? subjectId.toUpperCase() : ""
    const { data, isLoading, error, mutate } = useSWR(
        code ? (["subject-resources", code] as const) : null,
        async (): Promise<{
            resources: Array<SubjectResource>
            collections: Array<SubjectCollection>
        }> => {
            const ws = await getSubjectWorkspace(code)
            const links = ws.resources.data?.links ?? []
            return {
                resources: links.map((link) => ({
                    id: link.id,
                    title: link.title,
                    type: "notes" as const,
                    sizeLabel: "",
                    updatedLabel: "",
                })),
                collections: [],
            }
        },
    )
    return {
        resources: data?.resources ?? [],
        collections: data?.collections ?? [],
        isLoading,
        error,
        mutate,
    }
}
