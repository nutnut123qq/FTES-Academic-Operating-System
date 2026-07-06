import useSWRMutation from "swr/mutation"
import { cancelTransfer, type TransferView } from "@/modules/api/rest/wallet"

/**
 * SWR mutation wrapper for {@link cancelTransfer}.
 */
export const usePostCancelTransferSwr = () => {
    const swr = useSWRMutation<TransferView, Error, string, string>(
        "POST_CANCEL_TRANSFER_SWR",
        async (_key, { arg }) => {
            return cancelTransfer(arg)
        },
    )

    return swr
}
