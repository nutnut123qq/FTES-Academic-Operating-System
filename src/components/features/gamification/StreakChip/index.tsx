"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { FireIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useGetMyStreakSwr } from "@/hooks/swr/api/rest/queries"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { StreakPopover, type StreakPopoverPlacement } from "../StreakPopover"

/** Props for {@link StreakChip}. */
export interface StreakChipProps extends WithClassNames<undefined> {
    /** Popover placement. Default "bottom end" (avatar-menu corner). */
    placement?: StreakPopoverPlacement
}

/**
 * Compact fire-chip showing the current streak, opening the {@link StreakPopover}.
 *
 * Reusable across surfaces (avatar menu, profile header, subject workspace).
 * Reads the live streak from `GET /gamification/me/streak` (auth-gated
 * {@link useGetMyStreakSwr}) so every instance shows the same backend value; a
 * skeleton pill stands in while the first fetch lands.
 *
 * @param props - {@link StreakChipProps}
 */
export const StreakChip = ({ placement = "bottom end", className }: StreakChipProps) => {
    const t = useTranslations("gamification")
    const { data, isLoading } = useGetMyStreakSwr()

    // First load (authenticated, no cache yet): mirror the pill box so the layout
    // does not jump when the streak count lands.
    if (isLoading && data === undefined) {
        return <Skeleton className={cn("h-[22px] w-11 rounded-full", className)} />
    }

    const currentStreak = data?.currentStreak ?? 0
    return (
        <StreakPopover placement={placement}>
            <button
                type="button"
                aria-label={t("streak.chipLabel", { count: currentStreak })}
                className={cn(
                    "inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    className,
                )}
            >
                <FireIcon className="size-4" weight="fill" aria-hidden focusable="false" />
                {currentStreak}
            </button>
        </StreakPopover>
    )
}
