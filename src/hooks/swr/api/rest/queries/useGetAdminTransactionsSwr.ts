"use client"

import useSWR from "swr"
import {
    listAdminTransactions,
    type TransactionView,
    type WalletPageView,
} from "@/modules/api/rest/wallet"

/**
 * SWR query wrapper for {@link listAdminTransactions}.
 */
export const useGetAdminTransactionsSwr = (params?: {
    type?: string | null
    from?: string | null
    to?: string | null
    page?: number
    size?: number
}) => {
    const swr = useSWR<WalletPageView<TransactionView>, Error>(
        [
            "GET_ADMIN_TRANSACTIONS_SWR",
            params?.type,
            params?.from,
            params?.to,
            params?.page,
            params?.size,
        ],
        () => listAdminTransactions(params),
    )

    return swr
}
