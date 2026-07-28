"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import { listSubjects } from "@/modules/api/rest/subject/subject"
import type { SubjectSummary } from "@/modules/api/rest/subject/types"
import { toSubjectFromSummary, type Subject } from "./useQuerySubjectSwr"

/**
 * Loads the subject catalog from the real BE (`GET /api/v1/subjects`, public).
 * Maps each {@link import("@/modules/api/rest/subject/types").SubjectSummary} row to
 * the FE {@link Subject} the catalog + workspace share. Filtering/search stay
 * client-side (the list is small); the hook API is unchanged.
 */
export const useQuerySubjectsSwr = () => {
    const locale = useLocale()
    const { data, isLoading, error } = useSWR(
        ["subjects", "catalog"],
        async (): Promise<Array<SubjectSummary>> => (await listSubjects({ size: 100 })).items,
    )
    // Map NGOÀI fetcher: tên môn phụ thuộc locale, để trong fetcher thì bản đã map bị cache
    // theo key và đổi ngôn ngữ vẫn ra tên cũ (hoặc phải nhét locale vào key → fetch lại thừa).
    const subjects: Array<Subject> = (data ?? []).map((row) => toSubjectFromSummary(row, locale))
    return { subjects, isLoading, error }
}
