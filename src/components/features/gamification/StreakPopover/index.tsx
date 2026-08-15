"use client"

import React, { useCallback } from "react"
import { Button, Chip, Popover, Typography, cn } from "@heroui/react"
import { useSWRConfig } from "swr"
import { useLocale, useTranslations } from "next-intl"
import { FireIcon, SnowflakeIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    myActivityDaysSwrKey,
    myStreakSwrKey,
    useGetMyActivityDaysSwr,
    useGetMyStreakSwr,
} from "@/hooks/swr/api/rest/queries"
import { usePostUseStreakFreezeSwr } from "@/hooks/swr/api/rest/mutations"
import { useViewerScopeId } from "@/hooks/swr/viewerScope"
import { useRestWithToast } from "@/modules/toast/hooks"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { StreakHeatmap, HEATMAP_WEEKS, type HeatmapCell } from "../StreakHeatmap"

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
 * avatar-menu fire chip). Shows the current streak, the longest streak, the
 * 12-week XP heatmap, and the streak-freeze inventory with a "use freeze" action.
 *
 * Reads live backend data (`GET /gamification/me/streak` +
 * `/gamification/me/activity-days`) so every trigger shows the same numbers.
 * Consuming a freeze posts to `/gamification/me/streak/freeze` and revalidates
 * the streak + activity windows. Closes on Esc (HeroUI Popover default).
 *
 * @param props - {@link StreakPopoverProps}
 */
export const StreakPopover = ({ children, placement = "bottom", className }: StreakPopoverProps) => {
    const t = useTranslations("gamification")
    const locale = useLocale()
    const { mutate } = useSWRConfig()
    const runRest = useRestWithToast()
    // The streak + activity keys are VIEWER-SCOPED, so revalidating them needs the
    // same id the hooks keyed on. Built through the hooks' own key builders
    // (`myStreakSwrKey` / `myActivityDaysSwrKey`) rather than a hand-written array:
    // a locally rebuilt key that drifts from the hook's would not throw — the mutate
    // would simply match nothing and the popover would stop updating after a freeze.
    const viewerId = useViewerScopeId()

    const { data: streak, isLoading: streakLoading } = useGetMyStreakSwr()
    const { data: activity } = useGetMyActivityDaysSwr(HEATMAP_WEEKS)
    const { trigger: useFreeze, isMutating: freezing } = usePostUseStreakFreezeSwr()

    const heatmapDays: Array<HeatmapCell> = activity?.days ?? []
    const freezeAvailable = streak?.freezeAvailable ?? 0

    /** Localized accessible label for one heatmap cell (date + XP earned). */
    const cellLabel = useCallback(
        (cell: HeatmapCell): string => {
            const date = new Date(`${cell.date}T00:00:00`).toLocaleDateString(locale)
            return `${date} — ${t("heatmap.xpLabel", { xp: cell.xp })}`
        },
        [locale, t],
    )

    /** Consume one freeze, then revalidate the streak + heatmap windows. */
    const onUseFreeze = useCallback(async () => {
        const result = await runRest(() => useFreeze(), {
            successMessage: t("streak.freezeUsed"),
        })
        // No viewer id means both hooks keyed to `null` and nothing was cached for
        // this viewer, so there is nothing to revalidate.
        if (result !== null && viewerId) {
            void mutate(myStreakSwrKey(viewerId))
            void mutate(myActivityDaysSwrKey(viewerId, HEATMAP_WEEKS))
        }
    }, [runRest, useFreeze, mutate, t, viewerId])

    return (
        <Popover>
            <Popover.Trigger className={cn(className)}>{children}</Popover.Trigger>
            <Popover.Content placement={placement} className="w-80 max-w-[calc(100vw-2rem)] p-4">
                <div className="flex flex-col gap-4">
                    {/* headline: current streak · longest streak */}
                    <div className="flex items-center gap-2">
                        <FireIcon className="size-6 text-accent" weight="fill" aria-hidden focusable="false" />
                        {streakLoading && streak === undefined ? (
                            <Skeleton className="h-6 w-24 rounded-medium" />
                        ) : (
                            <Typography type="h6" weight="bold">
                                {t("streak.daysCount", { count: streak?.currentStreak ?? 0 })}
                            </Typography>
                        )}
                        <Chip size="sm" variant="soft" color="accent" className="ml-auto">
                            {t("streak.longest", { count: streak?.longestStreak ?? 0 })}
                        </Chip>
                    </div>

                    {/* 12-week XP heatmap */}
                    <div className="flex flex-col gap-2">
                        <Typography type="body-xs" color="muted">
                            {t("streak.heatmapTitle")}
                        </Typography>
                        <StreakHeatmap days={heatmapDays} weeks={HEATMAP_WEEKS} cellLabel={cellLabel} className="overflow-x-auto" />
                        <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted">
                            <span>{t("heatmap.less")}</span>
                            <span className="size-3 rounded-sm bg-[var(--heat-0)]" aria-hidden />
                            <span className="size-3 rounded-sm bg-[var(--heat-2)]" aria-hidden />
                            <span className="size-3 rounded-sm bg-[var(--heat-3)]" aria-hidden />
                            <span className="size-3 rounded-sm bg-[var(--heat-4)]" aria-hidden />
                            <span>{t("heatmap.more")}</span>
                        </div>
                    </div>

                    {/* streak-freeze inventory + use action */}
                    <div className="flex items-center gap-2 rounded-medium bg-default/40 p-3 text-sm">
                        <SnowflakeIcon className="size-4 text-accent" aria-hidden focusable="false" />
                        <span>{t("streak.freezeCount", { count: freezeAvailable })}</span>
                        <Button
                            size="sm"
                            variant="tertiary"
                            className="ml-auto"
                            isDisabled={freezeAvailable <= 0 || freezing}
                            onPress={() => void onUseFreeze()}
                        >
                            {t("streak.useFreeze")}
                        </Button>
                    </div>
                </div>
            </Popover.Content>
        </Popover>
    )
}
