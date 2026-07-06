import useSWRMutation from "swr/mutation"
import {
    report,
    type CreateReportRequest,
} from "@/modules/api/rest/community"

/**
 * SWR mutation wrapper for {@link report}.
 */
export const usePostReportCommunityContentSwr = () => {
    const swr = useSWRMutation<string, Error, string, CreateReportRequest>(
        "POST_REPORT_COMMUNITY_CONTENT_SWR",
        async (_key, { arg }) => {
            return report(arg)
        },
    )

    return swr
}
