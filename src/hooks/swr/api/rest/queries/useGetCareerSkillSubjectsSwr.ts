"use client"

import useSWR from "swr"
import {
    getCareerSkillSubjects,
    type CareerSkillSubjectLink,
} from "@/modules/api/rest/career"

/**
 * SWR query wrapper for {@link getCareerSkillSubjects} — the subjects one skill is
 * mapped to (`career.skill_subject_map`).
 *
 * @param slug - the skill slug; `null` (no skill picked yet) skips the read entirely,
 * so nothing is issued for a screen that would have nothing to show.
 * @returns the SWR entry; `data` is the raw id + weight rows, which the caller must
 * join against the subject catalogue to name (the endpoint carries no subject name).
 */
export const useGetCareerSkillSubjectsSwr = (slug: string | null) => {
    const swr = useSWR(
        slug ? (["GET_CAREER_SKILL_SUBJECTS_SWR", slug] as const) : null,
        async ([, skillSlug]): Promise<Array<CareerSkillSubjectLink>> =>
            (await getCareerSkillSubjects(skillSlug)) ?? [],
    )

    return swr
}
