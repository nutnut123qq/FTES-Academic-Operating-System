import useSWRMutation from "swr/mutation"
import { mapCareerSkillToSubject } from "@/modules/api/rest/career"

/**
 * Params for {@link usePostMapCareerSkillSubjectSwr}.
 */
export interface MapCareerSkillSubjectParams {
    slug: string
    /** Subject **UUID** (the `[subjectId]` route segment is the CODE — not it). */
    subjectId: string
    /** `career.skill_subject_map.weight` (0..1); omitted → the backend default. */
    weight?: number
}

/**
 * SWR mutation wrapper for {@link mapCareerSkillToSubject}.
 */
export const usePostMapCareerSkillSubjectSwr = () => {
    const swr = useSWRMutation<void, Error, string, MapCareerSkillSubjectParams>(
        "POST_MAP_CAREER_SKILL_SUBJECT_SWR",
        async (_key, { arg }) => {
            return mapCareerSkillToSubject(arg.slug, arg.subjectId, arg.weight)
        },
    )

    return swr
}
