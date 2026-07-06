import useSWRMutation from "swr/mutation"
import {
    createCareerRoadmap,
    type CareerRoadmap,
    type CreateCareerRoadmapRequest,
} from "@/modules/api/rest/career"

/**
 * SWR mutation wrapper for {@link createCareerRoadmap}.
 */
export const usePostCreateCareerRoadmapSwr = () => {
    const swr = useSWRMutation<
        CareerRoadmap,
        Error,
        string,
        CreateCareerRoadmapRequest
    >("POST_CREATE_CAREER_ROADMAP_SWR", async (_key, { arg }) => {
        return createCareerRoadmap(arg)
    })

    return swr
}
