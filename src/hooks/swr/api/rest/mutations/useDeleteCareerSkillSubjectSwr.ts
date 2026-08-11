import useSWRMutation from "swr/mutation"
import { unmapCareerSkillFromSubject } from "@/modules/api/rest/career"

/**
 * Params for {@link useDeleteCareerSkillSubjectSwr}.
 */
export interface DeleteCareerSkillSubjectParams {
    slug: string
    /** Subject **UUID** as it sits in `career.skill_subject_map` (may be a stale one). */
    subjectId: string
}

/**
 * SWR mutation wrapper for {@link unmapCareerSkillFromSubject}.
 */
export const useDeleteCareerSkillSubjectSwr = () => {
    const swr = useSWRMutation<void, Error, string, DeleteCareerSkillSubjectParams>(
        "DELETE_CAREER_SKILL_SUBJECT_SWR",
        async (_key, { arg }) => {
            return unmapCareerSkillFromSubject(arg.slug, arg.subjectId)
        },
    )

    return swr
}
