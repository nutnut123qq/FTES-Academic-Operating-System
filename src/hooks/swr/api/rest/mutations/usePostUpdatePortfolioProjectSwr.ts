import useSWRMutation from "swr/mutation"
import {
    updatePortfolioProject,
    type ProfileProjectRequest,
    type ProjectView,
} from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link updatePortfolioProject}.
 */
export const usePostUpdatePortfolioProjectSwr = () => {
    const swr = useSWRMutation<
        ProjectView,
        Error,
        string,
        { id: string; request: ProfileProjectRequest }
    >("POST_UPDATE_PORTFOLIO_PROJECT_SWR", async (_key, { arg }) => {
        return updatePortfolioProject(arg.id, arg.request)
    })

    return swr
}
