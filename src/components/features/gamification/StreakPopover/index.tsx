"use client"

import React from "react"
import { Button, Chip, Popover, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { FireIcon, LightningIcon, SnowflakeIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { FREEZE, nextMilestone, streakMultiplier } from "../rules"
import { DayStatus, useGamificationEngine, type HeatmapDay } from "../engine"
import { StreakHeatmap } from "../StreakHeatmap"

/** Popover placement values used by the streak surfaces. */
export type StreakPopoverPlacement =
    | "bottom"
    | "bottom start"
    | "bottom end"
    | "top"
    | "top start"
    | "top end"

/** Props for {@link StreakPopover}. */
export interface StreakPopoverProps extends WithClassNames<undefined> {
    /** The trigger element (stat card, avatar chip, …). */
    children: React.ReactNode
    /** Popover placement. Default "bottom". */
    placement?: StreakPopoverPlacement
}

/**
 * Streak detail popover (opened from the leaderboard Streak stat card and the
 * avatar-menu fire chip). Shows the current streak + multiplier, the 12-week
 * calendar heatmap, freeze inventory, the next milestone countdown, and — inside
 * the 48h window — the repair action. Reads the shared mock engine so every
 * trigger shows the same numbers. Closes on Esc (HeroUI Popover default).
 *
 * @param props - {@link StreakPopoverProps}
 */
export const StreakPopover = ({ children, placement = "bottom", className }: StreakPopoverProps) => {
    const t = useTranslations("gamification")
    const locale = useLocale()
    const { state, multiplier, heatmap, repairAvailable, repairCoinCost, buyFreeze, repairStreak } =
        useGamificationEngine()

    const upcoming = nextMilestone(state.streak)

    /** Localized accessible label for one heatmap cell (date + status). */
    const cellLabel = (day: HeatmapDay): string => {
        const date = new Date(`${day.date}T00:00:00`).toLocaleDateString(locale)
        const statusKey =
            day.status === DayStatus.Active
                ? "heatmap.active"
                : day.status === DayStatus.Frozen
                    ? "heatmap.frozen"
                    : "heatmap.empty"
        return `${date} — ${t(statusKey)}`
    }

    return (
        <Popover>
            <Popover.Trigger className={cn(className)}>{children}</Popover.Trigger>
            <Popover.Content placement={placement} className="w-80 max-w-[calc(100vw-2rem)] p-4">
                <div className="flex flex-col gap-4">
                    {/* headline: N days · +M% XP */}
                    <div className="flex items-center gap-2">
                        <FireIcon className="size-6 text-accent" weight="fill" aria-hidden focusable="false" />
                        <Typography type="h6" weight="bold">
                            {t("streak.daysCount", { count: state.streak })}
                        </Typography>
                        <Chip size="sm" variant="soft" color="accent" className="ml-auto">
                            {t("streak.multiplier", { percent: Math.round(multiplier * 100) })}
                        </Chip>
                    </div>

                    {/* 12-week calendar heatmap */}
                    <div className="flex flex-col gap-2">
                        <Typography type="body-xs" color="muted">
                            {t("streak.heatmapTitle")}
                        </Typography>
                        <StreakHeatmap days={heatmap} cellLabel={cellLabel} className="overflow-x-auto" />
                        <div className="flex items-center gap-3 text-[10px] text-muted">
                            <span className="flex items-center gap-1">
                                <span className="size-3 rounded-sm bg-[var(--heat-4)]" aria-hidden />
                                {t("heatmap.active")}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="size-3 rounded-sm bg-accent/30 ring-1 ring-inset ring-accent/50" aria-hidden />
                                {t("heatmap.frozen")}
                            </span>
                        </div>
                    </div>

                    {/* freeze inventory + next milestone */}
                    <div className="flex flex-col gap-2 rounded-medium bg-default/40 p-3">
                        <div className="flex items-center gap-2 text-sm">
                            <SnowflakeIcon className="size-4 text-accent" aria-hidden focusable="false" />
                            <span>{t("streak.freezeCount", { count: state.freezes })}</span>
                            <Button
                                size="sm"
                                variant="tertiary"
                                className="ml-auto"
                                isDisabled={state.freezes >= FREEZE.max || state.coin < FREEZE.cost}
                                onPress={() => buyFreeze()}
                            >
                                {t("streak.buyFreeze", { cost: FREEZE.cost })}
                            </Button>
                        </div>
                        {upcoming ? (
                            <Typography type="body-xs" color="muted" className="flex items-center gap-1">
                                <LightningIcon className="size-4" aria-hidden focusable="false" />
                                {t("streak.nextMilestone", {
                                    remaining: upcoming.remaining,
                                    days: upcoming.milestone.days,
                                })}
                            </Typography>
                        ) : null}
                    </div>

                    {/* repair — only inside the 48h window after a reset */}
                    {repairAvailable ? (
                        <div className="flex flex-col gap-2 rounded-medium border border-warning/40 bg-warning/5 p-3">
                            <Typography type="body-sm" weight="medium">
                                {t("streak.lostTitle", { days: state.lostStreak?.days ?? 0 })}
                            </Typography>
                            <Button
                                size="sm"
                                variant="primary"
                                isDisabled={state.coin < repairCoinCost}
                                onPress={() => repairStreak()}
                            >
                                {t("streak.repair", { cost: repairCoinCost })}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </Popover.Content>
        </Popover>
    )
}
