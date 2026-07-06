import useSWRMutation from "swr/mutation"
import {
    patchCareerRoadmap,
    type CareerRoadmap,
    type PatchCareerRoadmapRequest,
} from "@/modules/api/rest/career"

/**
 * Params for {@link usePostPatchCareerRoadmapSwr}.
 */
export interface PatchCareerRoadmapParams {
    slug: string
    request: PatchCareerRoadmapRequest
}

/**
 * SWR mutation wrapper for {@link patchCareerRoadmap}.
 */
export const usePostPatchCareerRoadmapSwr = () => {
    const swr = useSWRMutation<
        CareerRoadmap,
        Error,
        string,
        PatchCareerRoadmapParams
    >("POST_PATCH_CAREER_ROADMAP_SWR", async (_key, { arg }) => {
        return patchCareerRoadmap(arg.slug, arg.request)
    })

    return swr
}
