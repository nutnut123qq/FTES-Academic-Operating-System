import useSWRMutation from "swr/mutation"
import { escalateReport } from "@/modules/api/rest/community"

/**
 * SWR mutation wrapper for {@link escalateReport}.
 */
export const usePostEscalateCommunityReportSwr = () => {
    const swr = useSWRMutation<string, Error, string, string>(
        "POST_ESCALATE_COMMUNITY_REPORT_SWR",
        async (_key, { arg }) => {
            return escalateReport(arg)
        },
    )

    return swr
}
