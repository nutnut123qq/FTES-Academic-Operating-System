import useSWRMutation from "swr/mutation"
import { uploadPortfolioAsset, type AssetView } from "@/modules/api/rest/profile"

/**
 * SWR mutation wrapper for {@link uploadPortfolioAsset}.
 */
export const usePostUploadPortfolioAssetSwr = () => {
    const swr = useSWRMutation<
        AssetView,
        Error,
        string,
        { file: File; type?: string | null; title?: string | null }
    >("POST_UPLOAD_PORTFOLIO_ASSET_SWR", async (_key, { arg }) => {
        return uploadPortfolioAsset(arg.file, arg.type, arg.title)
    })

    return swr
}
