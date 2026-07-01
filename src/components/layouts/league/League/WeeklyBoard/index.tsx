"use client"

import React, {
    useMemo,
} from "react"
import {
    Skeleton,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    LeagueTier,
    LeagueTierBadge,
} from "@/components/reuseable/LeagueTierBadge"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryMyLeagueSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyLeagueSwr"
import { useAppSelector } from "@/redux/hooks"
import { LeagueRow } from "@/components/reuseable/LeagueRow"

/** Props for {@link WeeklyBoard}. */
export type WeeklyBoardProps = WithClassNames<undefined>

/**
 * The full weekly-league board (the uncapped version of the dashboard
 * `LeagueCard`): tier + reset countdown + promote/demote legend, then EVERY
 * ranked cohort member via the shared {@link LeagueRow} (rank-movement caret
 * included). Self-fetches its own leaf query.
 *
 * @param props - optional className for the root element.
 */
export const WeeklyBoard = ({
    className,
}: WeeklyBoardProps) => {
    const t = useTranslations()
    const { data, isLoading } = useQueryMyLeagueSwr()
    const me = useAppSelector((state) => state.user.user)

    /** Hours/days left until the weekly reset (computed from `weekEndAt`). */
    const countdown = useMemo(
        () => {
            if (!data) {
                return null
            }
            const remaining = Math.max(
                0,
                new Date(data.weekEndAt).getTime() - Date.now(),
            )
            return {
                days: Math.floor(remaining / 86_400_000),
                hours: Math.floor((remaining % 86_400_000) / 3_600_000),
            }
        },
        [
            data,
        ],
    )

    // first load — placeholder rows so the column never jumps
    if (isLoading && !data) {
        return (
            <div className={cn("flex flex-col gap-1.5", className)}>
                {Array.from({
                    length: 8,
                }).map((_, index) => (
                    <Skeleton
                        key={index}
                        className="h-10 w-full rounded-3xl"
                    />
                ))}
            </div>
        )
    }

    // nothing to show until the viewer is placed in a cohort
    if (!data || data.entries.length === 0) {
        return null
    }

    const total = data.entries.length
    const demoteFrom = total - data.demoteCount

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {/* tier + reset countdown */}
            <div className="flex items-center justify-between gap-3">
                <LeagueTierBadge
                    tier={data.tier as LeagueTier}
                    size={24}
                    showLabel
                />
                {countdown ? (
                    <span className="text-xs text-muted">
                        {t("dashboard.league.resetIn", {
                            days: countdown.days,
                            hours: countdown.hours,
                        })}
                    </span>
                ) : null}
            </div>

            {/* promote / demote legend */}
            <div className="flex items-center gap-3 text-[11px] text-muted">
                <span className="flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full bg-success" />
                    {t("dashboard.league.promote", {
                        count: data.promoteCount,
                    })}
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="size-2 shrink-0 rounded-full bg-danger" />
                    {t("dashboard.league.demote", {
                        count: data.demoteCount,
                    })}
                </span>
            </div>

            {/* full cohort — every member, no cap */}
            <div className="flex flex-col gap-1.5">
                {data.entries.map((entry) => (
                    <LeagueRow
                        key={entry.userGlobalId}
                        entry={entry}
                        isPromote={entry.rank <= data.promoteCount}
                        isDemote={entry.rank > demoteFrom}
                        isMe={Boolean(me?.username) && entry.username === me?.username}
                    />
                ))}
            </div>
        </div>
    )
}
