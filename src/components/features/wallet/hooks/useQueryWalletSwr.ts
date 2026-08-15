"use client"

import useSWR from "swr"
import { getMyTransactions, getMyWallet } from "@/modules/api/rest/wallet"
import { useAppSelector } from "@/redux/hooks"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import type { TransactionView } from "@/modules/api/rest/wallet"

/**
 * Direction of a ledger entry relative to the current user's wallet:
 * `IN` = the user received coins (credit), `OUT` = the user sent coins (debit).
 */
export type WalletTxDirection = "IN" | "OUT"

/** One ledger row in the FTES Coin wallet, mapped from the BE `TransactionView`. */
export interface WalletTransaction {
    id: string
    /** Raw BE `TransactionType` (e.g. `RECEIVE`, `REFERRAL_BONUS`). Drives icon + label. */
    type: string
    /** Settlement status (`PENDING`, `COMPLETED`, `CANCELLED`, `EXPIRED`). */
    status: string
    direction: WalletTxDirection
    /** Signed FTES Coin delta: IN > 0, OUT < 0. */
    amount: number
    /** BE `memo`, or `""` when the entry has no note. */
    description: string
    /** ISO timestamp from the BE (`createdAt`). Formatted for display by the view. */
    createdAt: string
}

export interface Wallet {
    /** Current FTES Coin balance (whole coins). */
    balance: number
    /** Wallet status (`ACTIVE`, `FROZEN`, `CLOSED`). */
    status: string
    transactions: Array<WalletTransaction>
}

/**
 * Shared SWR key builder so the wallet page + profile-progress tile dedupe the same
 * fetch — and so nobody rebuilds the key array by hand somewhere else (a hand-written
 * copy drifts the moment the shape changes, and the mismatch is a SILENT no-op).
 *
 * The key carries the VIEWER ID: this is a wallet balance + ledger, so serving it from
 * another account's cache entry is the worst leak in this codebase. `["wallet","me"]`
 * without an identity is ONE entry for everybody — sign out of A and into B in the same
 * tab and B reads A's balance straight from the cache (stale-while-revalidate paints it
 * instantly, and inside `dedupingInterval` no re-fetch even runs).
 */
export const walletSwrKey = (viewerId: string) => ["wallet", "me", viewerId] as const

/** History page size — the shell shows a single recent page (no pager yet). */
const HISTORY_PAGE_SIZE = 20

/** Maps a BE `TransactionView` to the FE ledger row, signing the amount by direction. */
const toTransaction = (t: TransactionView): WalletTransaction => {
    const direction: WalletTxDirection = t.direction === "OUT" ? "OUT" : "IN"
    const magnitude = Math.abs(t.amount)
    return {
        id: t.id,
        type: t.type,
        status: t.status,
        direction,
        amount: direction === "OUT" ? -magnitude : magnitude,
        description: t.memo ?? "",
        createdAt: t.createdAt,
    }
}

/**
 * Fetches the FTES Coin wallet + recent ledger from the real BE:
 * `GET /api/v1/wallet/me` (balance/status) + `GET /api/v1/wallet/me/transactions`
 * (history). Both require the caller's JWT; the id ví is resolved from the principal.
 */
const fetchWallet = async (): Promise<Wallet> => {
    const [wallet, history] = await Promise.all([
        getMyWallet(),
        getMyTransactions({ page: 0, size: HISTORY_PAGE_SIZE }),
    ])
    return {
        balance: wallet.balance,
        status: wallet.status,
        transactions: history.items.map(toTransaction),
    }
}

/**
 * Loads the FTES Coin wallet (balance + ledger) from the BE wallet REST endpoints.
 *
 * Gated on a signed-in, IDENTIFIED viewer: guests (and the sliver right after sign-in
 * while the `me` query is still in flight) key to `null`, so no request goes out and
 * the balance falls through to 0. That fetch gate is a DELIBERATE behaviour change —
 * `/wallet/me` without a token only ever returned 401 — and it is what keeps an
 * unattributable answer from landing in a cache entry that a later viewer can read.
 */
export const useQueryWalletSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const viewerId = useViewerScopeId()
    const { data, isLoading, error, mutate } = useSWR(
        authenticated && viewerId ? walletSwrKey(viewerId) : null,
        fetchWallet,
    )
    return {
        balance: data?.balance ?? 0,
        status: data?.status,
        transactions: data?.transactions ?? [],
        // A null key never "loads": SWR leaves data undefined with isLoading false, so
        // the shell renders its empty state instead of an eternal skeleton.
        isLoading: Boolean(authenticated && viewerId) && isLoading,
        error,
        mutate,
    }
}
