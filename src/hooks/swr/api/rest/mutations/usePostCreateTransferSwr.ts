import useSWRMutation from "swr/mutation"
import {
    createTransfer,
    type TransferRequest,
    type TransferView,
} from "@/modules/api/rest/wallet"

/**
 * SWR mutation wrapper for {@link createTransfer}.
 */
export const usePostCreateTransferSwr = () => {
    const swr = useSWRMutation<TransferView, Error, string, TransferRequest>(
        "POST_CREATE_TRANSFER_SWR",
        async (_key, { arg }) => {
            return createTransfer(arg)
        },
    )

    return swr
}
