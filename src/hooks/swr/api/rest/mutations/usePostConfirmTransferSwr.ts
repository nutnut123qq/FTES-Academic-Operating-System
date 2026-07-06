import useSWRMutation from "swr/mutation"
import { confirmTransfer, type TransferView } from "@/modules/api/rest/wallet"

/**
 * SWR mutation wrapper for {@link confirmTransfer}.
 */
export const usePostConfirmTransferSwr = () => {
    const swr = useSWRMutation<TransferView, Error, string, string>(
        "POST_CONFIRM_TRANSFER_SWR",
        async (_key, { arg }) => {
            return confirmTransfer(arg)
        },
    )

    return swr
}
