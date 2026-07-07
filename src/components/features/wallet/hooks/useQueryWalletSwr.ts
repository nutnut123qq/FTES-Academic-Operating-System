"use client"

import useSWR from "swr"
import { getMyTransactions, getMyWallet } from "@/modules/api/rest/wallet"
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

/** Shared SWR key so the wallet page + profile-progress tile dedupe the same fetch. */
export const WALLET_KEY = ["wallet", "me"] as const

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

/** Loads the FTES Coin wallet (balance + ledger) from the BE wallet REST endpoints. */
export const useQueryWalletSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(WALLET_KEY, fetchWallet)
    return {
        balance: data?.balance ?? 0,
        status: data?.status,
        transactions: data?.transactions ?? [],
        isLoading,
        error,
        mutate,
    }
}
