"use client"

import useSWR from "swr"

/** A transaction kind — drives the icon + amount sign in the history list. */
export type WalletTxKind = "receive" | "transfer" | "purchase" | "refund"

/** One ledger row in the FTES Coin wallet. `amount` is signed (see kind). */
export interface WalletTransaction {
    id: string
    kind: WalletTxKind
    /** Signed FTES Coin delta: receive/refund > 0, transfer/purchase < 0. */
    amount: number
    description: string
    /** ISO date string. */
    date: string
}

export interface Wallet {
    /** Current FTES Coin balance. */
    balance: number
    transactions: Array<WalletTransaction>
}

// ponytail: mock BE — no wallet endpoint yet. Deterministic sample ledger, SWR-shaped
// so the shell swaps to a real GraphQL query (wallet()) later without touching the hook
// API. Amounts are pre-signed by kind (receive/refund +, transfer/purchase -).
const fetchWalletMock = async (): Promise<Wallet> => ({
    balance: 2450,
    transactions: [
        { id: "tx-01", kind: "receive", amount: 500, description: "Thưởng hoàn thành khoá CSD201", date: "2026-06-30" },
        { id: "tx-02", kind: "purchase", amount: -300, description: "Mở khoá tài liệu Đồ án phần mềm", date: "2026-06-28" },
        { id: "tx-03", kind: "receive", amount: 200, description: "Điểm danh chuỗi 7 ngày", date: "2026-06-27" },
        { id: "tx-04", kind: "transfer", amount: -150, description: "Chuyển cho Trần Thu Hà", date: "2026-06-25" },
        { id: "tx-05", kind: "refund", amount: 300, description: "Hoàn tiền huỷ đăng ký sự kiện", date: "2026-06-23" },
        { id: "tx-06", kind: "purchase", amount: -450, description: "Đổi voucher đồng phục CLB", date: "2026-06-20" },
        { id: "tx-07", kind: "receive", amount: 1000, description: "Nạp FTES Coin qua ví điện tử", date: "2026-06-18" },
        { id: "tx-08", kind: "transfer", amount: -100, description: "Góp quỹ nhóm SWP391", date: "2026-06-15" },
    ],
})

/** Loads the FTES Coin wallet (balance + ledger). Mocked; SWR-shaped for a BE swap. */
export const useQueryWalletSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["wallet"], () => fetchWalletMock())
    return {
        balance: data?.balance ?? 0,
        transactions: data?.transactions ?? [],
        isLoading,
        error,
        mutate,
    }
}
