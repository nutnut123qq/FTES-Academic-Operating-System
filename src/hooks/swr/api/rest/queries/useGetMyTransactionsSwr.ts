"use client"

import useSWR from "swr"
import {
    getMyTransactions,
    type TransactionView,
    type WalletPageView,
} from "@/modules/api/rest/wallet"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"

/** SWR cache key prefix for the caller's wallet transaction ledger. */
export const MY_TRANSACTIONS_SWR_KEY = "GET_MY_TRANSACTIONS_SWR"

/** Filter/paging shape accepted by {@link useGetMyTransactionsSwr}. */
export interface MyTransactionsParams {
    type?: string | null
    from?: string | null
    to?: string | null
    page?: number
    size?: number
}

/**
 * Builds the viewer-scoped SWR key for {@link useGetMyTransactionsSwr}. `null` disables
 * the fetch (guest, or the `me` query still in flight). Import this from a call site
 * that needs to `mutate` the entry — never hand-write the tuple.
 */
export const myTransactionsKey = (
    viewerId: string | null,
    params?: MyTransactionsParams,
) =>
    viewerId
        ? ([
              MY_TRANSACTIONS_SWR_KEY,
              viewerId,
              params?.type,
              params?.from,
              params?.to,
              params?.page,
              params?.size,
          ] as const)
        : null

/**
 * SWR query wrapper for {@link getMyTransactions}.
 *
 * The key carries the VIEWER ID: filters and paging do not identify an account, so the
 * default "all transactions, page 0" view was one cache entry shared by every user —
 * signing out of A and into B in the same tab painted B with A's money movements.
 */
export const useGetMyTransactionsSwr = (params?: MyTransactionsParams) => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const swr = useSWR<WalletPageView<TransactionView>, Error>(
        authenticated ? myTransactionsKey(viewerId, params) : null,
        () => getMyTransactions(params),
    )

    return swr
}
