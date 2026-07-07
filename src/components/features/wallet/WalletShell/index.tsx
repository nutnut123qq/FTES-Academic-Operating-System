"use client"

import React from "react"
import { Button, Chip, Skeleton, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import {
    ArrowClockwiseIcon,
    ArrowDownIcon,
    ArrowsLeftRightIcon,
    ArrowUpIcon,
    CoinsIcon,
    GiftIcon,
    PlusIcon,
    ShoppingBagIcon,
    SlidersHorizontalIcon,
    TicketIcon,
    TrophyIcon,
    WalletIcon,
} from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryWalletSwr, type WalletTransaction } from "../hooks/useQueryWalletSwr"

/** Icon per BE `TransactionType` — mirrors the semantic of the ledger row. */
const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
    RECEIVE: ArrowDownIcon,
    TRANSFER: ArrowsLeftRightIcon,
    PURCHASE: ShoppingBagIcon,
    REFUND: ArrowClockwiseIcon,
    REDEEM_VOUCHER: TicketIcon,
    GIFT: GiftIcon,
    REWARD_CREDIT: TrophyIcon,
    REFERRAL_BONUS: GiftIcon,
    ADMIN_ADJUST: SlidersHorizontalIcon,
    OPENING_BALANCE: WalletIcon,
}

/** BE `TransactionType` names with a localized `txTypes.*` label; others fall back to `UNKNOWN`. */
const KNOWN_TYPES = new Set(Object.keys(TYPE_ICON))

/** Formats an ISO timestamp to a locale date, degrading to the raw date slice on parse failure. */
const formatTxDate = (iso: string, locale: string): string => {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
        return iso.slice(0, 10)
    }
    return date.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

/** One ledger row: type icon + note/label/date + signed, colored amount. */
const TransactionRow = ({ tx }: { tx: WalletTransaction }) => {
    const t = useTranslations("wallet")
    const locale = useLocale()
    const Icon = TYPE_ICON[tx.type] ?? (tx.direction === "OUT" ? ArrowUpIcon : ArrowDownIcon)
    const isCredit = tx.amount >= 0
    const sign = isCredit ? "+" : "−"
    const typeLabel = t(`txTypes.${KNOWN_TYPES.has(tx.type) ? tx.type : "UNKNOWN"}`)
    const dateLabel = formatTxDate(tx.createdAt, locale)
    // Primary line: the human note when present, else the type label. Secondary keeps the
    // type visible (with date) whenever the note took the headline.
    const primary = tx.description || typeLabel
    const secondary = tx.description ? `${typeLabel} · ${dateLabel}` : dateLabel

    return (
        <li className="flex items-center gap-3 py-3">
            <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    isCredit ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                }`}
                aria-hidden="true"
            >
                <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <Typography type="body-sm" weight="medium" className="truncate">
                        {primary}
                    </Typography>
                    {tx.status === "PENDING" && (
                        <Chip size="sm" variant="soft" color="warning">
                            {t("pending")}
                        </Chip>
                    )}
                </div>
                <Typography type="body-xs" color="muted">
                    {secondary}
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

/** Loading skeleton — mirrors the ledger list (icon tile + two text lines + amount). */
const HistorySkeleton = () => (
    <ul className="flex flex-col divide-y divide-separator rounded-2xl border border-separator px-4">
        {[0, 1, 2, 3].map((index) => (
            <li key={index} className="flex items-center gap-3 py-3">
                <Skeleton className="size-10 shrink-0 rounded-xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-2/3 rounded-full" />
                    <Skeleton className="h-3 w-24 rounded-full" />
                </div>
                <Skeleton className="h-3 w-12 shrink-0 rounded-full" />
            </li>
        ))}
    </ul>
)

/**
 * Wallet & FTES Coin shell (§12) — the `/wallet` surface. A hero balance card
 * (FTES Coin, accent) + action buttons (top-up / transfer / redeem — payment out of
 * scope) + a signed, colored transaction history. Data comes from the real BE wallet
 * REST endpoints (`GET /wallet/me` + `/wallet/me/transactions`); tokens own the look.
 */
export const WalletShell = () => {
    const t = useTranslations("wallet")
    const { balance, transactions, isLoading, error, mutate } = useQueryWalletSwr()
    const isEmpty = transactions.length === 0

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-0">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            {/* balance hero card */}
            <div className="flex flex-col gap-6 rounded-2xl border border-separator bg-accent/5 p-6">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-0">
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
                        className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"
                        aria-hidden="true"
                    >
                        <WalletIcon className="size-6" />
                    </div>
                </div>

                {/* actions — payment (top-up/withdraw) out of scope; buttons left as-is */}
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
            <div className="flex flex-col gap-3">
                <Typography type="h6" weight="bold">
                    {t("history")}
                </Typography>
                <AsyncContent
                    isLoading={isLoading && isEmpty}
                    skeleton={<HistorySkeleton />}
                    isEmpty={isEmpty}
                    emptyContent={{
                        title: t("empty"),
                        icon: <CoinsIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                    }}
                    error={isEmpty ? error : undefined}
                    errorContent={{
                        title: t("errorTitle"),
                        onRetry: () => void mutate(),
                        retryLabel: t("states.retry"),
                    }}
                >
                    <ul className="flex flex-col divide-y divide-separator rounded-2xl border border-separator px-4">
                        {transactions.map((tx) => (
                            <TransactionRow key={tx.id} tx={tx} />
                        ))}
                    </ul>
                </AsyncContent>
            </div>
        </div>
    )
}
