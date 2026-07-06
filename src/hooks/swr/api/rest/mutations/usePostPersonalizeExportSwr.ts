import useSWRMutation from "swr/mutation"
import {
    requestPersonalizeExport,
    type RecommendationExportRequest,
    type RecommendationExportView,
} from "@/modules/api/rest/recommendation"

/**
 * SWR mutation wrapper for {@link requestPersonalizeExport}.
 */
export const usePostPersonalizeExportSwr = () => {
    const swr = useSWRMutation<
        RecommendationExportView,
        Error,
        string,
        RecommendationExportRequest
    >("POST_PERSONALIZE_EXPORT_SWR", async (_key, { arg }) => {
        return requestPersonalizeExport(arg)
    })

    return swr
}
