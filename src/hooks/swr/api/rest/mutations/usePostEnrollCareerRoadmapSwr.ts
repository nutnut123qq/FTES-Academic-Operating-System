import useSWRMutation from "swr/mutation"
import {
    enrollCareerRoadmap,
    type CareerRoadmapEnrollment,
} from "@/modules/api/rest/career"

/**
 * SWR mutation wrapper for {@link enrollCareerRoadmap}.
 */
export const usePostEnrollCareerRoadmapSwr = () => {
    const swr = useSWRMutation<
        CareerRoadmapEnrollment,
        Error,
        string,
        string
    >("POST_ENROLL_CAREER_ROADMAP_SWR", async (_key, { arg }) => {
        return enrollCareerRoadmap(arg)
    })

    return swr
}
