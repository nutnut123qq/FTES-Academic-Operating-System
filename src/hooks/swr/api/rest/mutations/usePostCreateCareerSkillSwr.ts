import useSWRMutation from "swr/mutation"
import {
    createCareerSkill,
    type CareerSkill,
    type CreateCareerSkillRequest,
} from "@/modules/api/rest/career"

/**
 * SWR mutation wrapper for {@link createCareerSkill}.
 */
export const usePostCreateCareerSkillSwr = () => {
    const swr = useSWRMutation<
        CareerSkill,
        Error,
        string,
        CreateCareerSkillRequest
    >("POST_CREATE_CAREER_SKILL_SWR", async (_key, { arg }) => {
        return createCareerSkill(arg)
    })

    return swr
}
