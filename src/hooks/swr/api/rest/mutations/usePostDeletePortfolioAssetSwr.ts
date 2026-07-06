import useSWRMutation from "swr/mutation"
import { deletePortfolioAsset } from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link deletePortfolioAsset}.
 */
export const usePostDeletePortfolioAssetSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_DELETE_PORTFOLIO_ASSET_SWR",
        async (_key, { arg }) => {
            return deletePortfolioAsset(arg)
        },
    )

    return swr
}
