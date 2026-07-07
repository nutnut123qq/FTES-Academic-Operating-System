"use client"

import useSWR from "swr"
import { getSelfProfile } from "@/modules/api/rest/profile"
import type { SelfProfile } from "@/modules/api/rest/profile"
import { SELF_PROFILE_KEY } from "./useQueryProfileSwr"

/** Academic info fields (all rendered as strings in the metric grid). */
export interface ProfileAcademic {
    university: string
    campus: string
    major: string
    semester: string
    gpa: string
}

/**
 * Adapts the BE `SelfProfile.academic` section into the Academic-tab model.
 * Every field degrades to an empty string when the BE has no value (the tab
 * shows an empty-state card only when all fields are blank). `gpa` may be null
 * BE-side when the viewer's privacy hides it.
 */
export const toAcademic = (profile: SelfProfile): ProfileAcademic => {
    const academic = profile.academic
    return {
        university: academic?.university ?? "",
        campus: academic?.campus ?? "",
        major: academic?.major ?? "",
        semester: academic?.currentSemester != null ? String(academic.currentSemester) : "",
        gpa: academic?.gpa != null ? String(academic.gpa) : "",
    }
}

/** Loads the viewer's academic info from the real BE (`GET /profiles/me`). */
export const useQueryProfileAcademicSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(SELF_PROFILE_KEY, getSelfProfile)
    return { academic: data ? toAcademic(data) : undefined, isLoading, error, mutate }
}
