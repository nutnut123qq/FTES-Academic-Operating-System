import useSWRMutation from "swr/mutation"
import {
    patchCareerMentorship,
    type CareerMentorship,
    type CareerMentorshipActionRequest,
} from "@/modules/api/rest/career"

/**
 * Params for {@link usePostPatchCareerMentorshipSwr}.
 */
export interface PatchCareerMentorshipParams {
    id: string
    request: CareerMentorshipActionRequest
}

/**
 * SWR mutation wrapper for {@link patchCareerMentorship}.
 */
export const usePostPatchCareerMentorshipSwr = () => {
    const swr = useSWRMutation<
        CareerMentorship,
        Error,
        string,
        PatchCareerMentorshipParams
    >("POST_PATCH_CAREER_MENTORSHIP_SWR", async (_key, { arg }) => {
        return patchCareerMentorship(arg.id, arg.request)
    })

    return swr
}
