import useSWRMutation from "swr/mutation"
import {
    redeemVoucher,
    type RedeemVoucherRequest,
} from "@/modules/api/rest/wallet"

/**
 * SWR mutation wrapper for {@link redeemVoucher}.
 */
export const usePostRedeemVoucherSwr = () => {
    const swr = useSWRMutation<string, Error, string, RedeemVoucherRequest>(
        "POST_REDEEM_VOUCHER_SWR",
        async (_key, { arg }) => {
            return redeemVoucher(arg)
        },
    )

    return swr
}
