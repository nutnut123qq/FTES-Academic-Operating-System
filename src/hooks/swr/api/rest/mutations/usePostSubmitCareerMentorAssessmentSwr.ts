import useSWRMutation from "swr/mutation"
import {
    submitCareerMentorAssessment,
    type CareerMentorAssessmentRequest,
    type CareerSkillAssessment,
} from "@/modules/api/rest/career"

/**
 * Params for {@link usePostSubmitCareerMentorAssessmentSwr}.
 */
export interface SubmitCareerMentorAssessmentParams {
    slug: string
    userId: string
    request: CareerMentorAssessmentRequest
}

/**
 * SWR mutation wrapper for {@link submitCareerMentorAssessment}.
 */
export const usePostSubmitCareerMentorAssessmentSwr = () => {
    const swr = useSWRMutation<
        CareerSkillAssessment,
        Error,
        string,
        SubmitCareerMentorAssessmentParams
    >("POST_SUBMIT_CAREER_MENTOR_ASSESSMENT_SWR", async (_key, { arg }) => {
        return submitCareerMentorAssessment(arg.slug, arg.userId, arg.request)
    })

    return swr
}
