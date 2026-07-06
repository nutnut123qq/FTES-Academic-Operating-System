import useSWRMutation from "swr/mutation"
import {
    patchCareerSkill,
    type CareerSkill,
    type PatchCareerSkillRequest,
} from "@/modules/api/rest/career"

/**
 * Params for {@link usePostPatchCareerSkillSwr}.
 */
export interface PatchCareerSkillParams {
    slug: string
    request: PatchCareerSkillRequest
}

/**
 * SWR mutation wrapper for {@link patchCareerSkill}.
 */
export const usePostPatchCareerSkillSwr = () => {
    const swr = useSWRMutation<
        CareerSkill,
        Error,
        string,
        PatchCareerSkillParams
    >("POST_PATCH_CAREER_SKILL_SWR", async (_key, { arg }) => {
        return patchCareerSkill(arg.slug, arg.request)
    })

    return swr
}
