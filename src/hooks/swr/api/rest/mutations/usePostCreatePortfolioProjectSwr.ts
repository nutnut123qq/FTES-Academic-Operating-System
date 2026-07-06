import useSWRMutation from "swr/mutation"
import {
    createPortfolioProject,
    type ProfileProjectCreateRequest,
    type ProjectView,
} from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link createPortfolioProject}.
 */
export const usePostCreatePortfolioProjectSwr = () => {
    const swr = useSWRMutation<
        ProjectView,
        Error,
        string,
        ProfileProjectCreateRequest
    >("POST_CREATE_PORTFOLIO_PROJECT_SWR", async (_key, { arg }) => {
        return createPortfolioProject(arg)
    })

    return swr
}
