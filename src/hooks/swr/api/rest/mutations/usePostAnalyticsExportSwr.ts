import useSWRMutation from "swr/mutation"
import {
    requestAnalyticsExport,
    type AnalyticsExportRequest,
    type AnalyticsExportResult,
} from "@/modules/api/rest/analytics"

/**
 * SWR mutation wrapper for {@link requestAnalyticsExport}.
 */
export const usePostAnalyticsExportSwr = () => {
    const swr = useSWRMutation<
        AnalyticsExportResult,
        Error,
        string,
        AnalyticsExportRequest
    >("POST_ANALYTICS_EXPORT_SWR", async (_key, { arg }) => {
        return requestAnalyticsExport(arg)
    })

    return swr
}
