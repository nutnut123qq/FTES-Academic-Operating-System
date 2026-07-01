"use client"

import React from "react"
import {
    Button,
    Chip,
    ProgressBar,
    Typography,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryMyAiQuotaSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyAiQuotaSwr"
import { AiSubTier } from "@/modules/api/graphql/queries/query-my-ai-settings"

/** Props for {@link AiQuotaCard}. */
export type AiQuotaCardProps = WithClassNames<undefined>

/** HeroUI {@link Chip} colour per paid tier. */
const TIER_CHIP_COLOR: Record<AiSubTier, "default" | "success" | "warning"> = {
    [AiSubTier.Plus]: "default",
    [AiSubTier.Pro]: "success",
    [AiSubTier.Max]: "warning",
}

/**
 * Right-rail AI-credit mini card: the single credit pool (free base + tier)
 * remaining in the current 5-hour and weekly windows, with a bar per window, a
 * tier chip when subscribed, and an upgrade CTA. Surfaces the AI allowance on
 * the home surface so the learner sees it before hitting the limit mid-task.
 * Self-fetches its own leaf query; renders nothing until the quota is known.
 * @param props - optional className for the root element.
 */
export const AiQuotaCard = ({
    className,
}: AiQuotaCardProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { data } = useQueryMyAiQuotaSwr()

    // signed out / not loaded → no card
    if (!data) {
        return null
    }

    const { credit, tier } = data

    // the two rolling windows rendered as remaining/limit + a usage bar
    const windows = [
        {
            key: "window5h",
            used: credit.used5h,
            limit: credit.limit5h,
            remaining: credit.remaining5h,
        },
        {
            key: "windowWeek",
            used: credit.usedWeek,
            limit: credit.limitWeek,
            remaining: credit.remainingWeek,
        },
    ]

    return (
        <div className={cn("flex w-full flex-col gap-3", className)}>
            {/* title row — plain heading (no card, no icon) + tier chip */}
            <div className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold text-foreground">
                    {t("dashboard.aiQuota.title")}
                </span>
                {tier ? (
                    <Chip
                        size="sm"
                        color={TIER_CHIP_COLOR[tier]}
                        variant="soft"
                    >
                        {tier.toUpperCase()}
                    </Chip>
                ) : null}
            </div>
            {/* clarify the two bars are ONE shared pool seen through two windows */}
            <Typography type="body-xs" color="muted">
                {t("dashboard.aiQuota.poolCaption")}
            </Typography>
            {windows.map((window) => (
                <div
                    key={window.key}
                    className="flex flex-col gap-1.5"
                >
                    <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted">
                            {t(`dashboard.aiQuota.${window.key}`)}
                        </span>
                        <span className="font-medium text-foreground">
                            {t("dashboard.aiQuota.credits", {
                                remaining: window.remaining,
                                limit: window.limit,
                            })}
                        </span>
                    </div>
                    <ProgressBar
                        aria-label={t(`dashboard.aiQuota.${window.key}`)}
                        value={window.used}
                        maxValue={window.limit || 1}
                        color="accent"
                        size="sm"
                    >
                        <ProgressBar.Track>
                            <ProgressBar.Fill />
                        </ProgressBar.Track>
                    </ProgressBar>
                </div>
            ))}
            <Button
                variant="tertiary"
                size="sm"
                className="self-start"
                onPress={() => router.push(`/${locale}/profile/settings/ai-subscription`)}
            >
                {t("dashboard.aiQuota.upgrade")}
            </Button>
        </div>
    )
}
