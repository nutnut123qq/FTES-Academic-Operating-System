"use client"

import React, {
    useMemo,
} from "react"
import {
    Link,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    LeagueTier,
    LeagueTierBadge,
} from "@/components/reuseable/LeagueTierBadge"
import {
    pathConfig,
} from "@/resources/path"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"
import { LeagueRow } from "@/components/reuseable/LeagueRow"
import { InfoTooltip } from "@/components/blocks/feedback/InfoTooltip"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import type { QueryMyLeagueData } from "@/modules/api/graphql/queries/types/league"

/** How many top-of-cohort rows to show before truncating (no inner scroll). */
const TOP_ROWS = 5

/** Props for {@link LeagueCardContent}. */
export interface LeagueCardContentProps extends WithClassNames<undefined> {
    /** The resolved (non-null) weekly-league standing — supplied by the container. */
    data: QueryMyLeagueData
    /**
     * When true, render inside a `LabeledCard` (label OUTSIDE) to match the dashboard
     * Community-tab siblings; otherwise the flat inline-heading layout (the /league page).
     */
    framed?: boolean
}

/**
 * Presentational body of {@link import("..").LeagueCard} once the league data has
 * resolved (tier · reset countdown · promote/demote legend · capped cohort rows ·
 * "+N others" footer). Split out of the container so the loading/empty branches can
 * live in a clean {@link import("@/components/blocks").AsyncContent} switch without
 * the derivations crashing on null data.
 * @param props - {@link LeagueCardContentProps}
 */
export const LeagueCardContent = ({
    data,
    framed = false,
    className,
}: LeagueCardContentProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const me = useAppSelector((state) => state.user.user)

    /** Hours/days left until the weekly reset (computed from `weekEndAt`). */
    const countdown = useMemo(
        () => {
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

    const total = data.entries.length
    const demoteFrom = total - data.demoteCount

    // the viewer's own standing (best-effort username match — no raw id on entries)
    const myEntry = me?.username
        ? data.entries.find((entry) => entry.username === me.username)
        : undefined
    const myPercent = myEntry
        ? Math.max(1, Math.ceil((myEntry.rank / total) * 100))
        : null

    // top rows, then the viewer's own row if it falls outside the visible top
    const topRows = data.entries.slice(0, TOP_ROWS)
    const showMyRow = Boolean(myEntry) && (myEntry?.rank ?? 0) > TOP_ROWS
    // people not represented by a visible row (top rows + the appended self row)
    const hiddenCount = Math.max(0, total - TOP_ROWS - (showMyRow ? 1 : 0))

    /** Render one full-width cohort row (rank · avatar · name · points · caret). */
    const renderRow = (entry: typeof data.entries[number]) => (
        <LeagueRow
            key={entry.userGlobalId}
            entry={entry}
            isPromote={entry.rank <= data.promoteCount}
            isDemote={entry.rank > demoteFrom}
            isMe={Boolean(me?.username) && entry.username === me?.username}
        />
    )

    /** League title (with help tooltip) — used flat (inline heading) or as the LabeledCard label. */
    const titleNode = (
        <InfoTooltip
            title={t("dashboard.league.title")}
            description={t("dashboard.league.help")}
        >
            {t("dashboard.league.title")}
        </InfoTooltip>
    )

    /** League body (tier · countdown · legend · cohort rows · footer) — heading-free. */
    const body = (
        <>
            {/* tier + reset countdown */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                    <InfoTooltip description={t("dashboard.league.tierHelp")}>
                        <LeagueTierBadge
                            tier={data.tier as LeagueTier}
                        />
                    </InfoTooltip>
                    {myEntry && myPercent !== null ? (
                        <span className="text-sm">
                            {t("dashboard.myProfile.rankLine", {
                                rank: myEntry.rank,
                                percent: myPercent,
                            })}
                        </span>
                    ) : null}
                </div>
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
                    <span className="size-2 shrink-0 rounded-3xl bg-success" />
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

            {/* capped cohort — no inner scroll; viewer's row appended if outside top */}
            <div className="flex w-full flex-col gap-1.5">
                {topRows.map(renderRow)}
                {showMyRow && myEntry ? renderRow(myEntry) : null}
            </div>

            {/* "+N others" + full-board link, inline on one line */}
            <div className="flex items-center gap-1.5 text-xs">
                {hiddenCount > 0 ? (
                    <span className="text-muted">
                        {t("dashboard.league.others", {
                            count: hiddenCount,
                        })}
                    </span>
                ) : null}
                <Link
                    href={pathConfig().locale(locale).league().build()}
                    className="inline-flex items-center text-xs font-medium text-accent hover:underline"
                >
                    {t("dashboard.league.seeMore")}
                </Link>
            </div>
        </>
    )

    // dashboard Community tab: framed in a LabeledCard (label OUTSIDE) to match siblings
    if (framed) {
        return (
            <LabeledCard label={titleNode} className={className} contentClassName="flex flex-col gap-3">
                {body}
            </LabeledCard>
        )
    }

    // standalone /league page: flat layout with an inline heading
    return (
        <div className={cn("flex w-full flex-col gap-3", className)}>
            <div className="font-semibold">{titleNode}</div>
            {body}
        </div>
    )
}

export default LeagueCardContent
