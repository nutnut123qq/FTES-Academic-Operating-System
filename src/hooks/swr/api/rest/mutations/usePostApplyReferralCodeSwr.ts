import useSWRMutation from "swr/mutation"
import {
    applyReferralCode,
    type ApplyReferralRequest,
} from "@/modules/api/rest/wallet"

/**
 * SWR mutation wrapper for {@link applyReferralCode}.
 */
export const usePostApplyReferralCodeSwr = () => {
    const swr = useSWRMutation<void, Error, string, ApplyReferralRequest>(
        "POST_APPLY_REFERRAL_CODE_SWR",
        async (_key, { arg }) => {
            return applyReferralCode(arg)
        },
    )

    return swr
}
