"use client"

import { useCallback, useState } from "react"
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
    /** Current FCoin balance (whole coins). */
    balance: number
    /** Wallet status (`ACTIVE`, `FROZEN`, `CLOSED`). */
    status: string
    /** VND per coin, or `undefined` when the BE does not send the rate yet. */
    vndPerCoin?: number
    transactions: Array<WalletTransaction>
    /**
     * Total ledger rows the BE holds, or `undefined` when it did not report one.
     * Drives "is there another page" WITHOUT a second request.
     */
    totalElements?: number
}

/**
 * A fetched wallet plus the viewer it was fetched FOR.
 *
 * The stamp exists because this hook opts into `keepPreviousData` (see below): SWR then
 * hands back the previous key's payload while the new key resolves, and one of the keys
 * that can change is the VIEWER. Without the stamp, signing out of A and into B would
 * paint A's balance during B's first fetch — the same money-shaped leak the viewer-scoped
 * key was introduced to close, re-opened through the back door.
 */
interface WalletSnapshot extends Wallet {
    viewerId: string
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
 *
 * The key also carries how many ledger rows are being asked for, so "show more"
 * is a plain key change (a fresh entry) instead of a hand-rolled cache mutation.
 */
export const walletSwrKey = (viewerId: string, historySize: number) =>
    ["wallet", "me", viewerId, historySize] as const

/**
 * Ledger rows shown before the reader asks for more. Ten is the product rule for
 * this surface ("only the 10 most recent, with a way to see more"), and it is
 * ALSO the request size — asking the BE for 20 and hiding 10 would pay for rows
 * nobody looks at and would make "show more" a lie about what was fetched.
 */
export const HISTORY_PAGE_SIZE = 10

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
 * Fetches the FCoin wallet + recent ledger from the real BE:
 * `GET /api/v1/wallet/me` (balance/status/rate) + `GET /api/v1/wallet/me/transactions`
 * (history). Both require the caller's JWT; the id ví is resolved from the principal.
 *
 * History is always page 0 with a GROWING size rather than page 1, 2, 3 … : the ledger
 * gains rows at the TOP (a top-up landing mid-session shifts every row down one), so
 * appending page N of a moving list would duplicate or skip entries. One window from the
 * newest row is always internally consistent.
 */
const fetchWallet = async (viewerId: string, historySize: number): Promise<WalletSnapshot> => {
    const [wallet, history] = await Promise.all([
        getMyWallet(),
        getMyTransactions({ page: 0, size: historySize }),
    ])
    return {
        viewerId,
        balance: wallet.balance,
        status: wallet.status,
        vndPerCoin: wallet.vndPerCoin,
        transactions: history.items.map(toTransaction),
        totalElements: history.totalElements,
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
    // How many ledger rows this reader has asked for. Grows by one page per
    // "show more"; never shrinks, so the list only ever gets longer under them.
    const [historySize, setHistorySize] = useState(HISTORY_PAGE_SIZE)
    const { data: fetched, isLoading: isFirstLoad, isValidating, error, mutate } = useSWR(
        authenticated && viewerId ? walletSwrKey(viewerId, historySize) : null,
        ([, , keyViewerId, size]) => fetchWallet(keyViewerId, size),
        // Growing the window changes the KEY, which normally means "no data yet" and a
        // full skeleton — the ten rows the reader was looking at would vanish and come
        // back. Keeping the previous page pinned turns "show more" into rows being
        // appended, which is what the button promises.
        { keepPreviousData: true },
    )

    // Held-over data is only usable when it belongs to the CURRENT viewer; a payload
    // stamped for someone else is dropped rather than rendered (see `WalletSnapshot`).
    const data = fetched?.viewerId === viewerId ? fetched : undefined

    const transactions = data?.transactions ?? []
    const total = data?.totalElements
    // Prefer the BE's own count. Without one, fall back to "the last window came back
    // full" — an honest guess that can show the button once too often, never one that
    // hides rows the reader has not seen.
    const hasMore = total === undefined
        ? transactions.length >= historySize
        : transactions.length < total

    const loadMore = useCallback(() => {
        setHistorySize((size) => size + HISTORY_PAGE_SIZE)
    }, [])

    return {
        balance: data?.balance ?? 0,
        status: data?.status,
        vndPerCoin: data?.vndPerCoin,
        transactions,
        totalElements: total,
        hasMore,
        loadMore,
        /** True only while a "show more" window is in flight (rows already on screen). */
        isLoadingMore: isValidating && data !== undefined && transactions.length < historySize,
        // "Loading" here means THERE IS NOTHING TO SHOW YET and a request is running —
        // which is the only state a skeleton is right for. Two subtleties:
        //  - A null key never "loads": guests get `false`, so the shell renders its empty
        //    state instead of an eternal skeleton.
        //  - "Show more" changes the key, and SWR calls that a fresh first load, but the
        //    previous rows are still on screen — requiring `data === undefined` keeps the
        //    ledger from flashing back to a skeleton under the reader mid-click.
        //  - After a viewer SWITCH the held-over payload was discarded above, so `data`
        //    is undefined while B's request runs and the skeleton is correct again.
        isLoading: Boolean(authenticated && viewerId)
            && data === undefined
            && (isFirstLoad || isValidating),
        error,
        mutate,
    }
}
