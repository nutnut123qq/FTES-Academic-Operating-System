import useSWRMutation from "swr/mutation"
import { gift, type GiftRequest, type TransferView } from "@/modules/api/rest/wallet"

/**
 * SWR mutation wrapper for {@link gift}.
 */
export const usePostGiftSwr = () => {
    const swr = useSWRMutation<TransferView, Error, string, GiftRequest>(
        "POST_GIFT_SWR",
        async (_key, { arg }) => {
            return gift(arg)
        },
    )

    return swr
}
