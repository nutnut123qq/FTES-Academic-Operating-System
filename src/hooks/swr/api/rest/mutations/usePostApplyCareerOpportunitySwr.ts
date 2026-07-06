import useSWRMutation from "swr/mutation"
import {
    applyCareerOpportunity,
    type ApplyCareerOpportunityRequest,
    type CareerOpportunityApplication,
} from "@/modules/api/rest/career"

/**
 * Params for {@link usePostApplyCareerOpportunitySwr}.
 */
export interface ApplyCareerOpportunityParams {
    id: string
    request: ApplyCareerOpportunityRequest
}

/**
 * SWR mutation wrapper for {@link applyCareerOpportunity}.
 */
export const usePostApplyCareerOpportunitySwr = () => {
    const swr = useSWRMutation<
        CareerOpportunityApplication,
        Error,
        string,
        ApplyCareerOpportunityParams
    >("POST_APPLY_CAREER_OPPORTUNITY_SWR", async (_key, { arg }) => {
        return applyCareerOpportunity(arg.id, arg.request)
    })

    return swr
}
