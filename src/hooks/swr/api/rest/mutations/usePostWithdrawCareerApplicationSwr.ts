import useSWRMutation from "swr/mutation"
import {
    withdrawCareerApplication,
    type CareerOpportunityApplication,
} from "@/modules/api/rest/career"

/**
 * SWR mutation wrapper for {@link withdrawCareerApplication}.
 */
export const usePostWithdrawCareerApplicationSwr = () => {
    const swr = useSWRMutation<
        CareerOpportunityApplication,
        Error,
        string,
        string
    >("POST_WITHDRAW_CAREER_APPLICATION_SWR", async (_key, { arg }) => {
        return withdrawCareerApplication(arg)
    })

    return swr
}
