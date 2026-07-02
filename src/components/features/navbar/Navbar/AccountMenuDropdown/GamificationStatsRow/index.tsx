"use client"

import React, { useCallback } from "react"
import { cn } from "@heroui/react"
import { FireIcon, LightningIcon, TrophyIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { pathConfig } from "@/resources/path"
import { useAccountMenuOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryMyGamificationSwr } from "@/components/features/gamification/hooks/useQueryMyGamificationSwr"
import { GamificationChip } from "@/components/blocks/gamification/GamificationChip"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link GamificationStatsRow}. */
export type GamificationStatsRowProps = WithClassNames<undefined>

/**
 * Compact gamification stats row for the SIGNED-IN account dropdown: three
 * {@link GamificationChip} links — streak 🔥 and XP ⚡ to the profile Progress
 * tab, rank 🏆 to `/leaderboard` — fed by the shared `useQueryMyGamificationSwr`
 * hook. While the snapshot loads, three same-sized skeleton chips hold the box
 * so the dropdown never jumps; on error with no data the row is omitted.
 *
 * @param props - optional root class name (placement only)
 */
export const GamificationStatsRow = ({ className }: GamificationStatsRowProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const { close } = useAccountMenuOverlayState()
    const { data, isLoading, error } = useQueryMyGamificationSwr()

    /** Close the menu, then navigate. */
    const go = useCallback(
        (path: string) => {
            close()
            router.push(path)
        },
        [close, router],
    )

    // error with nothing to show → drop the whole row, the menu still works
    if (error && !data) return null

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            <AsyncContent
                isLoading={isLoading && !data}
                skeleton={
                    <>
                        <Skeleton.Chip />
                        <Skeleton.Chip />
                        <Skeleton.Chip />
                    </>
                }
            >
                {data ? (
                    <>
                        <GamificationChip
                            icon={<FireIcon weight="fill" className="size-4" aria-hidden focusable="false" />}
                            value={data.streak.current}
                            label={t("accountMenu.gamification.streakLabel", { count: data.streak.current })}
                            onPress={() => go(pathConfig().locale().profile().progress().build())}
                        />
                        <GamificationChip
                            icon={<TrophyIcon weight="fill" className="size-4" aria-hidden focusable="false" />}
                            value={`#${data.rank.position}`}
                            label={t("accountMenu.gamification.rankLabel", { position: data.rank.position })}
                            onPress={() => go(pathConfig().locale().leaderboard().build())}
                        />
                        <GamificationChip
                            icon={<LightningIcon weight="fill" className="size-4" aria-hidden focusable="false" />}
                            value={data.xp.toLocaleString(locale)}
                            label={t("accountMenu.gamification.xpLabel", { xp: data.xp.toLocaleString(locale) })}
                            onPress={() => go(pathConfig().locale().profile().progress().build())}
                        />
                    </>
                ) : null}
            </AsyncContent>
        </div>
    )
}
