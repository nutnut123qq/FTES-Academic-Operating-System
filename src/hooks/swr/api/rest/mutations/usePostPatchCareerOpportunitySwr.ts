import useSWRMutation from "swr/mutation"
import {
    patchCareerOpportunity,
    type CareerOpportunity,
    type PatchCareerOpportunityRequest,
} from "@/modules/api/rest/career"

/**
 * Params for {@link usePostPatchCareerOpportunitySwr}.
 */
export interface PatchCareerOpportunityParams {
    id: string
    request: PatchCareerOpportunityRequest
}

/**
 * SWR mutation wrapper for {@link patchCareerOpportunity}.
 */
export const usePostPatchCareerOpportunitySwr = () => {
    const swr = useSWRMutation<
        CareerOpportunity,
        Error,
        string,
        PatchCareerOpportunityParams
    >("POST_PATCH_CAREER_OPPORTUNITY_SWR", async (_key, { arg }) => {
        return patchCareerOpportunity(arg.id, arg.request)
    })

    return swr
}
