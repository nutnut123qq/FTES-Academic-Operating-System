"use client"

import useSWR from "swr"
import {
    getMyTransactions,
    type TransactionView,
    type WalletPageView,
} from "@/modules/api/rest/wallet"

/**
 * SWR query wrapper for {@link getMyTransactions}.
 */
export const useGetMyTransactionsSwr = (params?: {
    type?: string | null
    from?: string | null
    to?: string | null
    page?: number
    size?: number
}) => {
    const swr = useSWR<WalletPageView<TransactionView>, Error>(
        [
            "GET_MY_TRANSACTIONS_SWR",
            params?.type,
            params?.from,
            params?.to,
            params?.page,
            params?.size,
        ],
        () => getMyTransactions(params),
    )

    return swr
}
