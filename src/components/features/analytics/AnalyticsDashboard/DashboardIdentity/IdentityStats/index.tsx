"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { FireIcon, LightningIcon, GiftIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryWeeklyStreakSwr } from "../../../hooks/useQueryWeeklyStreakSwr"
import { useQueryAiQuotaSwr } from "../../../hooks/useQueryAiQuotaSwr"
import { useQueryRewardWalletSwr } from "../../../hooks/useQueryRewardWalletSwr"

/** Props for {@link IdentityStats}. */
export type IdentityStatsProps = WithClassNames<undefined>

/** Skeleton mirroring one `icon + label + value` row while its leaf query resolves. */
const SkeletonStatRow = () => (
    <div className="flex items-center gap-2">
        <Skeleton className="size-5 shrink-0 rounded-full" />
        <Skeleton className="my-1 h-3 flex-1 rounded" />
        <Skeleton className="my-1 h-3 w-10 rounded" />
    </div>
)

/**
 * Viewer "standing" stat rows for the identity column — `icon + label + value`
 * lines so each metric reads clearly in the narrow sidebar: current streak,
 * remaining AI chat calls today, reward balance. Bare (mirrors profile meta rows).
 * Self-fetches three REAL leaf queries; no data props.
 *
 * Each row owns its own {@link AsyncContent} rather than sharing one: the three
 * queries resolve independently, so a shared gate would hold all three back for the
 * slowest. This column is mounted on EVERY dashboard tab, so a row that merely
 * vanished on failure would leave a permanently short sidebar with no explanation —
 * hence a real error branch per row instead of `{data ? ... : null}`.
 * @param props - optional className for the root list.
 */
export const IdentityStats = ({ className }: IdentityStatsProps) => {
    const t = useTranslations("analytics")
    const weeklySwr = useQueryWeeklyStreakSwr()
    const quotaSwr = useQueryAiQuotaSwr()
    const walletSwr = useQueryRewardWalletSwr()
    const { data: weekly } = weeklySwr
    const { data: quota } = quotaSwr
    const { data: wallet } = walletSwr

    /** Shared error copy for a stat row; `onRetry` revalidates just that row's leaf. */
    const errorContent = (onRetry: () => void) => ({
        title: t("overview.loadError"),
        onRetry,
        retryLabel: t("overview.retry"),
    })

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <AsyncContent
                isLoading={weeklySwr.isLoading && !weekly}
                skeleton={<SkeletonStatRow />}
                isEmpty={!weekly}
                error={weeklySwr.error}
                errorContent={errorContent(() => { void weeklySwr.mutate() })}
            >
                <div className="flex items-center gap-2">
                    <FireIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                    <Typography type="body-sm" color="muted" className="flex-1 truncate">
                        {t("overview.identityStats.streak")}
                    </Typography>
                    <Typography type="body-sm" weight="medium">
                        {t("overview.identityStats.streakValue", { count: weekly?.streak ?? 0 })}
                    </Typography>
                </div>
            </AsyncContent>
            <AsyncContent
                isLoading={quotaSwr.isLoading && !quota}
                skeleton={<SkeletonStatRow />}
                isEmpty={!quota}
                error={quotaSwr.error}
                errorContent={errorContent(() => { void quotaSwr.mutate() })}
            >
                <div className="flex items-center gap-2">
                    <LightningIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                    <Typography type="body-sm" color="muted" className="flex-1 truncate">
                        {t("overview.identityStats.credit")}
                    </Typography>
                    <Typography type="body-sm" weight="medium">
                        {t("overview.identityStats.creditValue", {
                            count: quota?.chatRemainingToday ?? 0,
                        })}
                    </Typography>
                </div>
            </AsyncContent>
            <AsyncContent
                isLoading={walletSwr.isLoading && !wallet}
                skeleton={<SkeletonStatRow />}
                isEmpty={!wallet}
                error={walletSwr.error}
                errorContent={errorContent(() => { void walletSwr.mutate() })}
            >
                <div className="flex items-center gap-2">
                    <GiftIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                    <Typography type="body-sm" color="muted" className="flex-1 truncate">
                        {t("overview.identityStats.reward")}
                    </Typography>
                    <Typography type="body-sm" weight="medium">
                        {t("overview.rewardBalance", { count: wallet?.balance ?? 0 })}
                    </Typography>
                </div>
            </AsyncContent>
        </div>
    )
}
