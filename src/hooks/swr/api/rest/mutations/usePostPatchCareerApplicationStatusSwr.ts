import useSWRMutation from "swr/mutation"
import {
    patchCareerApplicationStatus,
    type CareerOpportunityApplication,
    type PatchCareerApplicationStatusRequest,
} from "@/modules/api/rest/career"

/**
 * Params for {@link usePostPatchCareerApplicationStatusSwr}.
 */
export interface PatchCareerApplicationStatusParams {
    id: string
    request: PatchCareerApplicationStatusRequest
}

/**
 * SWR mutation wrapper for {@link patchCareerApplicationStatus}.
 */
export const usePostPatchCareerApplicationStatusSwr = () => {
    const swr = useSWRMutation<
        CareerOpportunityApplication,
        Error,
        string,
        PatchCareerApplicationStatusParams
    >("POST_PATCH_CAREER_APPLICATION_STATUS_SWR", async (_key, { arg }) => {
        return patchCareerApplicationStatus(arg.id, arg.request)
    })

    return swr
}
