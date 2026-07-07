"use client"

import useSWR from "swr"
import { listSubjects } from "@/modules/api/rest/subject/subject"
import { toSubjectFromSummary, type Subject } from "./useQuerySubjectSwr"

/**
 * Loads the subject catalog from the real BE (`GET /api/v1/subjects`, public).
 * Maps each {@link import("@/modules/api/rest/subject/types").SubjectSummary} row to
 * the FE {@link Subject} the catalog + workspace share. Filtering/search stay
 * client-side (the list is small); the hook API is unchanged.
 */
export const useQuerySubjectsSwr = () => {
    const { data, isLoading, error } = useSWR(
        ["subjects", "catalog"],
        async (): Promise<Array<Subject>> => {
            const page = await listSubjects({ size: 100 })
            return page.items.map(toSubjectFromSummary)
        },
    )
    return { subjects: data ?? [], isLoading, error }
}
