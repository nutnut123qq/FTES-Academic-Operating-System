"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { FireIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useGamificationEngine } from "../engine"
import { StreakPopover, type StreakPopoverPlacement } from "../StreakPopover"

/** Props for {@link StreakChip}. */
export interface StreakChipProps extends WithClassNames<undefined> {
    /** Popover placement. Default "bottom end" (avatar-menu corner). */
    placement?: StreakPopoverPlacement
}

/**
 * Compact fire-chip showing the current streak, opening the {@link StreakPopover}.
 *
 * Reusable across surfaces (avatar menu, profile header, subject workspace) so
 * the streak always reads from the SAME mock engine store and stays in lockstep
 * with the leaderboard. Drop it wherever a streak indicator is wanted.
 *
 * @param props - {@link StreakChipProps}
 */
export const StreakChip = ({ placement = "bottom end", className }: StreakChipProps) => {
    const t = useTranslations("gamification")
    const { state } = useGamificationEngine()
    return (
        <StreakPopover placement={placement}>
            <button
                type="button"
                aria-label={t("streak.chipLabel", { count: state.streak })}
                className={cn(
                    "inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent",
                    className,
                )}
            >
                <FireIcon className="size-4" weight="fill" aria-hidden focusable="false" />
                {state.streak}
            </button>
        </StreakPopover>
    )
}
