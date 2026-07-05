import useSWRMutation from "swr/mutation"
import {
    reportPreviewLimit,
    type PreviewLimitRequest,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostReportPreviewLimitSwr}.
 */
export interface ReportPreviewLimitParams {
    lessonId: string
    request?: PreviewLimitRequest
}

/**
 * SWR mutation wrapper for {@link reportPreviewLimit}.
 */
export const usePostReportPreviewLimitSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        ReportPreviewLimitParams
    >(
        "POST_REPORT_PREVIEW_LIMIT_SWR",
        async (_key, { arg }) => {
            return reportPreviewLimit(arg.lessonId, arg.request)
        },
    )

    return swr
}
