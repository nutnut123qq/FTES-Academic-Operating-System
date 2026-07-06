"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { FireIcon, LightningIcon, GiftIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryWeeklyStreakSwr } from "../../../hooks/useQueryWeeklyStreakSwr"
import { useQueryAiQuotaSwr } from "../../../hooks/useQueryAiQuotaSwr"
import { useQueryRewardWalletSwr } from "../../../hooks/useQueryRewardWalletSwr"

/** Props for {@link IdentityStats}. */
export type IdentityStatsProps = WithClassNames<undefined>

/**
 * Viewer "standing" stat rows for the identity column — `icon + label + value`
 * lines so each metric reads clearly in the narrow sidebar: current streak,
 * remaining weekly AI credit, reward balance. Bare (mirrors profile meta rows);
 * each row self-hides until its leaf resolves. Self-fetches; no data props.
 * @param props - optional className for the root list.
 */
export const IdentityStats = ({ className }: IdentityStatsProps) => {
    const t = useTranslations("analytics")
    const { data: weekly } = useQueryWeeklyStreakSwr()
    const { data: quota } = useQueryAiQuotaSwr()
    const { data: wallet } = useQueryRewardWalletSwr()

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {weekly ? (
                <div className="flex items-center gap-2">
                    <FireIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                    <Typography type="body-sm" color="muted" className="flex-1 truncate">
                        {t("overview.identityStats.streak")}
                    </Typography>
                    <Typography type="body-sm" weight="medium">
                        {t("overview.identityStats.streakValue", { count: weekly.streak })}
                    </Typography>
                </div>
            ) : null}
            {quota ? (
                <div className="flex items-center gap-2">
                    <LightningIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                    <Typography type="body-sm" color="muted" className="flex-1 truncate">
                        {t("overview.identityStats.credit")}
                    </Typography>
                    <Typography type="body-sm" weight="medium">
                        {quota.credit.remainingWeek}/{quota.credit.limitWeek}
                    </Typography>
                </div>
            ) : null}
            {wallet ? (
                <div className="flex items-center gap-2">
                    <GiftIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                    <Typography type="body-sm" color="muted" className="flex-1 truncate">
                        {t("overview.identityStats.reward")}
                    </Typography>
                    <Typography type="body-sm" weight="medium">
                        {t("overview.rewardBalance", { count: wallet.balance })}
                    </Typography>
                </div>
            ) : null}
        </div>
    )
}
