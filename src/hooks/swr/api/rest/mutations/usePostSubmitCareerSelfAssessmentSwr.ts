import useSWRMutation from "swr/mutation"
import {
    submitCareerSelfAssessment,
    type CareerSelfAssessmentRequest,
    type CareerSkillAssessment,
} from "@/modules/api/rest/career"

/**
 * Params for {@link usePostSubmitCareerSelfAssessmentSwr}.
 */
export interface SubmitCareerSelfAssessmentParams {
    slug: string
    request: CareerSelfAssessmentRequest
}

/**
 * SWR mutation wrapper for {@link submitCareerSelfAssessment}.
 */
export const usePostSubmitCareerSelfAssessmentSwr = () => {
    const swr = useSWRMutation<
        CareerSkillAssessment,
        Error,
        string,
        SubmitCareerSelfAssessmentParams
    >("POST_SUBMIT_CAREER_SELF_ASSESSMENT_SWR", async (_key, { arg }) => {
        return submitCareerSelfAssessment(arg.slug, arg.request)
    })

    return swr
}
