"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { CheckCircleIcon, CoinsIcon, WalletIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { FtesMascot } from "@/components/reuseable/FtesMascot"
import { MascotCelebration } from "@/components/features/mascot-moments"
import { pathConfig } from "@/resources/path"
import { useAppSelector } from "@/redux/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { GamificationChip } from "@/components/blocks/gamification/GamificationChip"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { useGetMyQuestsSwr } from "@/hooks/swr/api/rest/queries/useGetMyQuestsSwr"
import { useGetMyWalletSwr } from "@/hooks/swr/api/rest/queries/useGetMyWalletSwr"
import type { QuestItemView } from "@/modules/api/rest/gamification"
import { QUEST_CTA_ICON, QUEST_FALLBACK_ICON, QUEST_ICON_MAP } from "./map"
import { questCtaHref, questProgress } from "./model"

/** Skeleton for a single quest card — mirrors the real card so the list never jumps. */
const QuestCardSkeleton = () => (
    <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
        <div className="flex items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-40 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-full" />
            </div>
            <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
    </div>
)

/** Board loading skeleton — a small stack of quest-card skeletons. */
const QuestBoardSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((row) => (
            <QuestCardSkeleton key={row} />
        ))}
    </div>
)

/** Props for {@link QuestCard}. */
interface QuestCardProps {
    quest: QuestItemView
}

/**
 * One quest row: icon + title + reward chip, an optional description, a progress
 * meter over the day's ceiling, the claimed-of-limit status, and — while there is
 * still a claim left AND the code maps to an earning surface — a "go do it" CTA.
 * Fully claimed quests dim and swap the CTA for a done marker.
 */
const QuestCard = ({ quest }: QuestCardProps) => {
    const t = useTranslations("gamification.quests")
    const locale = useLocale()
    const { total, current, isDone } = questProgress(quest)
    const href = isDone ? null : questCtaHref(quest.code, locale)

    return (
        <div
            className={cn(
                "flex flex-col gap-3 rounded-2xl border border-separator p-4 transition-opacity",
                isDone && "opacity-60",
            )}
        >
            <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    {QUEST_ICON_MAP[quest.code] ?? QUEST_FALLBACK_ICON}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Typography type="body-sm" weight="medium" className="min-w-0 flex-1 truncate">
                            {quest.title}
                        </Typography>
                        <Chip color="warning" variant="soft" size="sm" className="shrink-0">
                            <Chip.Label>{t("perClaim", { coin: quest.rewardCoin })}</Chip.Label>
                        </Chip>
                    </div>
                    {quest.description ? (
                        <Typography type="body-xs" color="muted">
                            {quest.description}
                        </Typography>
                    ) : null}
                </div>
            </div>

            <ProgressMeter
                value={current}
                max={total}
                label={t("progressLabel", { current, total })}
                aria-label={quest.title}
            />

            <div className="flex items-center justify-between gap-2">
                <Typography type="body-xs" color="muted">
                    {t("claimedOfLimit", { claimed: quest.completedCount, limit: quest.dailyLimit })}
                </Typography>
                {isDone ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <CheckCircleIcon className="size-4" weight="fill" aria-hidden focusable="false" />
                        {t("done")}
                    </span>
                ) : href ? (
                    <Link
                        href={href}
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground no-underline transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        {t("goDo")}
                        {QUEST_CTA_ICON}
                    </Link>
                ) : null}
            </div>
        </div>
    )
}

/**
 * The `/quests` daily quest board — today's quests from
 * `GET /api/v1/gamification/me/quests` (change `gamification-quest-coin-engine`),
 * each with live progress, the coin reward per claim, the claimed-of-limit status
 * and a CTA to the surface that earns it. The header sums today's coins
 * (`totalCoinToday`) and shows the wallet balance (`GET /api/v1/wallet/me`,
 * 1000 xu = 1000đ). Guests are gated with a sign-in empty-state (no `/me/*`
 * request fires). Coins auto-credit on a backend worker, so the quest hook polls
 * on a 60s interval — no socket, no manual reload. Ships no mock fallback: when
 * the API is unavailable the board renders skeletons then an error state.
 */
export const QuestBoard = () => {
    const t = useTranslations("gamification.quests")
    const tm = useTranslations("mascot")
    const locale = useLocale()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { data, error, isLoading, mutate } = useGetMyQuestsSwr()
    const { data: wallet } = useGetMyWalletSwr()

    // Guest gate — mirror the other `/me/*` surfaces: no request has fired (the
    // hook keyed to null), so just prompt sign-in.
    if (!authenticated) {
        return (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <EmptyContent
                    icon={<FtesMascot pose="greeting" size="lg" />}
                    title={t("signInPrompt")}
                    description={tm("greeting.guest")}
                    action={
                        <Link
                            href={pathConfig().locale(locale).authentication().build()}
                            className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground no-underline transition-colors hover:bg-accent/90"
                        >
                            {t("signIn")}
                        </Link>
                    }
                />
            </div>
        )
    }

    const quests = [...(data?.quests ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
    // Every quest claimed to its daily limit → a once-a-day mascot celebration.
    const allClaimed = quests.length > 0 && quests.every((quest) => questProgress(quest).isDone)

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            {/* header: title + today's coins + wallet balance */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-0">
                    <Typography type="h4" weight="bold">
                        {t("title")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("subtitle")}
                    </Typography>
                </div>
                <div className="flex items-center gap-5">
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                        <Typography type="body-xs" color="muted">
                            {t("todayEarned")}
                        </Typography>
                        <GamificationChip
                            icon={<CoinsIcon className="size-4" weight="fill" aria-hidden focusable="false" />}
                            value={(data?.totalCoinToday ?? 0).toLocaleString(locale)}
                            label={t("todayEarnedLabel", {
                                coin: (data?.totalCoinToday ?? 0).toLocaleString(locale),
                            })}
                        />
                    </div>
                    <div className="flex flex-col items-start gap-1 sm:items-end">
                        <Typography type="body-xs" color="muted">
                            {t("walletBalance")}
                        </Typography>
                        <GamificationChip
                            icon={<WalletIcon className="size-4" aria-hidden focusable="false" />}
                            value={(wallet?.balance ?? 0).toLocaleString(locale)}
                            label={t("walletBalanceLabel", {
                                coin: (wallet?.balance ?? 0).toLocaleString(locale),
                            })}
                        />
                    </div>
                </div>
            </div>

            {/* all quests claimed today → cheer once/day (mutually exclusive with the
                explain empty-state below, so only one mascot is ever on screen) */}
            {allClaimed ? (
                <MascotCelebration
                    id="questAllClaimed"
                    title={t("celebrateAllClaimedTitle")}
                    body={t("celebrateAllClaimedBody")}
                />
            ) : null}

            <AsyncContent
                isLoading={isLoading && quests.length === 0}
                skeleton={<QuestBoardSkeleton />}
                isEmpty={quests.length === 0}
                emptyContent={{
                    icon: <FtesMascot pose="explain" size="lg" />,
                    title: t("empty"),
                }}
                error={quests.length === 0 ? error : undefined}
                errorContent={{
                    title: t("loadError"),
                    onRetry: () => void mutate(),
                    retryLabel: t("retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {quests.map((quest) => (
                        <QuestCard key={quest.code} quest={quest} />
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
