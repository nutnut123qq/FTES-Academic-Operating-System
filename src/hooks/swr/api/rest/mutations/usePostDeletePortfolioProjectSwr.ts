import useSWRMutation from "swr/mutation"
import { deletePortfolioProject } from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link deletePortfolioProject}.
 */
export const usePostDeletePortfolioProjectSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_DELETE_PORTFOLIO_PROJECT_SWR",
        async (_key, { arg }) => {
            return deletePortfolioProject(arg)
        },
    )

    return swr
}
