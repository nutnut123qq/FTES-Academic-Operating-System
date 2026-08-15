"use client"

import useSWR from "swr"
import { useLocale } from "next-intl"
import { getSelfProfile } from "@/modules/api/rest/profile"
import type { SelfProfile } from "@/modules/api/rest/profile"
import { useSelfProfileKey } from "./useQueryProfileSwr"

/** Academic info fields (all rendered as strings in the metric grid). */
export interface ProfileAcademic {
    university: string
    campus: string
    /** Chuyên ngành chữ tự do (cột cũ). */
    major: string
    /**
     * NGÀNH chọn từ danh mục (BE V335), đã dịch sẵn tên theo locale. Rỗng = chưa chọn — ô này
     * khi đó không hiện, giống mọi field học vấn khác.
     */
    majorFromCatalog: string
    semester: string
    gpa: string
}

/**
 * Adapts the BE `SelfProfile.academic` section into the Academic-tab model.
 * Every field degrades to an empty string when the BE has no value (the tab
 * shows an empty-state card only when all fields are blank). `gpa` may be null
 * BE-side when the viewer's privacy hides it.
 */
export const toAcademic = (profile: SelfProfile, locale = "vi"): ProfileAcademic => {
    const academic = profile.academic
    const vietnamese = locale.startsWith("vi")
    return {
        university: academic?.university ?? "",
        campus: academic?.campus ?? "",
        major: academic?.major ?? "",
        majorFromCatalog:
            (vietnamese ? academic?.majorNameVi : academic?.majorName)
            || academic?.majorNameVi
            || academic?.majorName
            || "",
        semester: academic?.currentSemester != null ? String(academic.currentSemester) : "",
        gpa: academic?.gpa != null ? String(academic.gpa) : "",
    }
}

/** Loads the viewer's academic info from the real BE (`GET /profiles/me`). */
export const useQueryProfileAcademicSwr = () => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(useSelfProfileKey(), getSelfProfile)
    return { academic: data ? toAcademic(data, locale) : undefined, isLoading, error, mutate }
}
