import useSWRMutation from "swr/mutation"
import {
    createCareerOpportunity,
    type CareerOpportunity,
    type CreateCareerOpportunityRequest,
} from "@/modules/api/rest/career"

/**
 * SWR mutation wrapper for {@link createCareerOpportunity}.
 */
export const usePostCreateCareerOpportunitySwr = () => {
    const swr = useSWRMutation<
        CareerOpportunity,
        Error,
        string,
        CreateCareerOpportunityRequest
    >("POST_CREATE_CAREER_OPPORTUNITY_SWR", async (_key, { arg }) => {
        return createCareerOpportunity(arg)
    })

    return swr
}
