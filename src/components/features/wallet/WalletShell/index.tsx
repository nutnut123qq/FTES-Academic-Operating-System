"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    ArrowClockwiseIcon,
    ArrowDownIcon,
    ArrowsLeftRightIcon,
    ArrowUpIcon,
    CoinsIcon,
    PlusIcon,
    ShoppingBagIcon,
    WalletIcon,
} from "@phosphor-icons/react"
import {
    useQueryWalletSwr,
    type WalletTransaction,
    type WalletTxKind,
} from "../hooks/useQueryWalletSwr"

/** Icon per transaction kind — mirrors the semantic of the ledger row. */
const KIND_ICON: Record<WalletTxKind, React.ComponentType<{ className?: string }>> = {
    receive: ArrowDownIcon,
    transfer: ArrowsLeftRightIcon,
    purchase: ShoppingBagIcon,
    refund: ArrowClockwiseIcon,
}

/** One ledger row: kind icon + description/date + signed, colored amount. */
const TransactionRow = ({ tx }: { tx: WalletTransaction }) => {
    const t = useTranslations("wallet")
    const Icon = KIND_ICON[tx.kind]
    const isCredit = tx.amount >= 0
    const sign = isCredit ? "+" : "−"

    return (
        <li className="flex items-center gap-3 py-3">
            <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-large ${
                    isCredit ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}
                aria-hidden="true"
            >
                <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
                <Typography type="body-sm" weight="medium" className="truncate">
                    {tx.description}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {t(`kinds.${tx.kind}`)} · {tx.date}
                </Typography>
            </div>
            <Typography
                type="body-sm"
                weight="bold"
                className={`shrink-0 tabular-nums ${isCredit ? "text-success" : "text-danger"}`}
            >
                {sign}
                {Math.abs(tx.amount).toLocaleString()}
            </Typography>
        </li>
    )
}

/**
 * Wallet & FTES Coin shell (§12) — the `/wallet` surface. A hero balance card
 * (FTES Coin, accent) + mock action buttons (top-up / transfer / redeem) + a
 * signed, colored transaction history. Feature owns data (mock) + formatting;
 * tokens own the look. ponytail: hand-rolled cards + mock ledger, no real money logic.
 */
export const WalletShell = () => {
    const t = useTranslations("wallet")
    const { balance, transactions } = useQueryWalletSwr()

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            {/* balance hero card */}
            <div className="flex flex-col gap-6 rounded-3xl border border-separator bg-accent/5 p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <Typography type="body-sm" color="muted">
                            {t("balanceLabel")}
                        </Typography>
                        <div className="flex items-baseline gap-2">
                            <Typography type="h4" weight="bold" className="text-accent tabular-nums">
                                {balance.toLocaleString()}
                            </Typography>
                            <Typography type="body-sm" weight="medium" className="text-accent">
                                {t("coin")}
                            </Typography>
                        </div>
                    </div>
                    <div
                        className="flex size-12 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent"
                        aria-hidden="true"
                    >
                        <WalletIcon className="size-6" />
                    </div>
                </div>

                {/* mock actions — no logic */}
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="primary">
                        <PlusIcon className="size-4" />
                        {t("actions.topup")}
                    </Button>
                    <Button size="sm" variant="secondary">
                        <ArrowUpIcon className="size-4" />
                        {t("actions.transfer")}
                    </Button>
                    <Button size="sm" variant="secondary">
                        <CoinsIcon className="size-4" />
                        {t("actions.redeem")}
                    </Button>
                </div>
            </div>

            {/* transaction history */}
            <div className="flex flex-col gap-2">
                <Typography type="h6" weight="bold">
                    {t("history")}
                </Typography>
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-large border border-separator border-dashed p-10 text-center">
                        <div
                            className="flex size-12 items-center justify-center rounded-large bg-default/40 text-muted"
                            aria-hidden="true"
                        >
                            <CoinsIcon className="size-6" />
                        </div>
                        <Typography type="body-sm" color="muted">
                            {t("empty")}
                        </Typography>
                    </div>
                ) : (
                    <ul className="flex flex-col divide-y divide-separator rounded-3xl border border-separator px-4">
                        {transactions.map((tx) => (
                            <TransactionRow key={tx.id} tx={tx} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
