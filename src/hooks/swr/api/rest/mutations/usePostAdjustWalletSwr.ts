import useSWRMutation from "swr/mutation"
import {
    adjustWallet,
    type AdjustmentRequest,
    type AdjustmentView,
} from "@/modules/api/rest/wallet"

/**
 * SWR mutation wrapper for {@link adjustWallet}.
 */
export const usePostAdjustWalletSwr = () => {
    const swr = useSWRMutation<
        AdjustmentView,
        Error,
        string,
        AdjustmentRequest
    >("POST_ADJUST_WALLET_SWR", async (_key, { arg }) => {
        return adjustWallet(arg)
    })

    return swr
}
