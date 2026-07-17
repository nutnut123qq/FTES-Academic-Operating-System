"use client"

import React from "react"
import { Skeleton, Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { FireIcon, LightningIcon, RankingIcon, StarIcon, TrophyIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryLeaderboardSwr } from "../hooks/useQueryLeaderboardSwr"
import { useQueryMyGamificationSwr } from "../hooks/useQueryMyGamificationSwr"
import { tierFromXp } from "../leaderboardTiers"
import { StreakPopover } from "../StreakPopover"
import { GoalsCard } from "../GoalsCard"
import { GamificationEventHost } from "../GamificationEventHost"

/** Loading skeleton — mirrors the ranked leaderboard rows so the list never jumps. */
const LeaderboardSkeleton = () => (
    <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((index) => (
            <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-separator p-4"
            >
                <Skeleton className="h-4 w-6 shrink-0 rounded-full" />
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-32 rounded-full" />
                    <Skeleton className="h-3 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-16 shrink-0 rounded-full" />
            </div>
        ))}
    </div>
)

/**
 * Gamification leaderboard + progression surface (§11) — the `/leaderboard` page.
 *
 * A dashboard driven by the live REST snapshots (`useQueryMyGamificationSwr`
 * composes the `/me/*` progression / streak / activity / badge endpoints, the
 * ranked board comes from `useQueryLeaderboardSwr`): stat cards (XP · Level ·
 * Streak · Rank+tier) where the Streak card opens the detail popover; a "Cách
 * tính điểm" guide link; a ranked board; the Daily/Weekly goals block; and the
 * viewer's earned badges. Quest-completion toasts and the level-up moment are
 * raised by the mounted {@link GamificationEventHost}, which diffs the same SWR
 * caches. Guests see the public board with dashed viewer stats (no `/me/*` call
 * fires). The mock engine has been removed — every number is real backend data.
 */
export const LeaderboardShell = () => {
    const t = useTranslations("gamification")
    const locale = useLocale()
    const { board, myUserId, isLoading, error, mutate } = useQueryLeaderboardSwr()
    const { data: my } = useQueryMyGamificationSwr()

    const { tier } = tierFromXp(my?.xp ?? 0)
    // XP still needed to reach the next level — the BE exposes only the next
    // threshold, so this is `nextThreshold − total` (0 while there is no snapshot).
    const toNext = my ? my.levelProgress.nextThreshold - my.levelProgress.current : 0
    // Guide is a child route of /leaderboard. pathConfig has no dedicated
    // builder for it (shared file, owned elsewhere); derive it from the
    // leaderboard base rather than hand-templating the whole path.
    const guideHref = `${pathConfig().locale(locale).leaderboard().build()}/guide`

    // Viewer stats come from the composed snapshot; `null` (no snapshot yet /
    // guest) renders as an em-dash instead of a misleading zero.
    const stats: Array<{ key: "xp" | "level" | "streak" | "rank"; icon: React.ReactNode; value: number | null; hint: string | undefined }> = [
        {
            key: "xp",
            icon: <LightningIcon className="size-5" aria-hidden focusable="false" />,
            value: my ? my.xp : null,
            hint: undefined,
        },
        {
            key: "level",
            icon: <StarIcon className="size-5" aria-hidden focusable="false" />,
            value: my ? my.level : null,
            hint: my ? t("levelHint", { xp: toNext.toLocaleString(locale) }) : undefined,
        },
        {
            key: "streak",
            icon: <FireIcon className="size-5" aria-hidden focusable="false" />,
            value: my ? my.streak.current : null,
            hint: undefined,
        },
        {
            key: "rank",
            icon: <RankingIcon className="size-5" aria-hidden focusable="false" />,
            value: board.findIndex((entry) => entry.id === myUserId) + 1,
            hint: my ? t(`tiers.${tier.key}`) : undefined,
        },
    ]

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <GamificationEventHost />

            <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0">
                    <Typography type="h4" weight="bold">
                        {t("title")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("subtitle")}
                    </Typography>
                </div>
                <Link
                    href={guideHref}
                    className="shrink-0 text-sm font-medium text-accent no-underline hover:underline"
                >
                    {t("guide.link")}
                </Link>
            </div>

            {/* stat cards — the Streak card opens the detail popover */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((stat) => {
                    // The streak card is clickable (opens the detail popover) → it
                    // gets the house interactive hover; the other three are static.
                    const interactive = stat.key === "streak"
                    const card = (
                        <div
                            className={`flex h-full flex-col gap-2 rounded-2xl bg-default/40 p-4 text-left ${
                                interactive ? "transition-colors group-hover:bg-default/60" : ""
                            }`}
                        >
                            <div className="flex items-center gap-2 text-muted">
                                {stat.icon}
                                <Typography type="body-xs" color="muted">
                                    {t(`stats.${stat.key}`)}
                                </Typography>
                            </div>
                            <Typography type="h5" weight="bold">
                                {/* Rank rides the real BE board — show "—" when the viewer is
                                    unranked (board empty/unseeded) or has no snapshot, not "0". */}
                                {stat.value == null || (stat.key === "rank" && stat.value < 1)
                                    ? "—"
                                    : Math.round(stat.value).toLocaleString(locale)}
                            </Typography>
                            {stat.hint ? (
                                <Typography type="body-xs" color="muted">
                                    {stat.hint}
                                </Typography>
                            ) : null}
                        </div>
                    )
                    if (interactive) {
                        return (
                            <StreakPopover key={stat.key} placement="bottom start" className="text-left">
                                <button
                                    type="button"
                                    className="group h-full w-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                    aria-label={t("streak.openDetail")}
                                >
                                    {card}
                                </button>
                            </StreakPopover>
                        )
                    }
                    return <React.Fragment key={stat.key}>{card}</React.Fragment>
                })}
            </div>

            {/* goals */}
            <GoalsCard />

            {/* leaderboard list */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <TrophyIcon className="size-5 text-accent" aria-hidden focusable="false" />
                    <Typography type="body" weight="medium">
                        {t("leaderboard")}
                    </Typography>
                </div>
                <AsyncContent
                    isLoading={isLoading && board.length === 0}
                    skeleton={<LeaderboardSkeleton />}
                    isEmpty={board.length === 0}
                    emptyContent={{ title: t("leaderboardEmpty") }}
                    error={board.length === 0 ? error : undefined}
                    errorContent={{
                        title: t("leaderboardError"),
                        onRetry: () => void mutate(),
                        retryLabel: t("states.retry"),
                    }}
                >
                    <div className="flex flex-col gap-2">
                        {board.map((entry) => {
                            const isMe = entry.id === myUserId
                            return (
                                <div
                                    key={entry.id}
                                    className={`flex items-center gap-3 rounded-2xl border border-separator p-4 ${
                                        isMe ? "bg-accent/10" : ""
                                    }`}
                                >
                                    <Typography
                                        type="body-sm"
                                        weight="bold"
                                        className={`w-6 shrink-0 text-center ${isMe ? "text-accent" : "text-muted"}`}
                                    >
                                        {entry.rank}
                                    </Typography>
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                                        {entry.avatarInitials}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <Typography type="body-sm" weight="medium" truncate>
                                            {entry.name}
                                        </Typography>
                                        {/* BE leaderboard carries no per-user level → hide the line rather than fabricate it. */}
                                        {entry.level != null ? (
                                            <Typography type="body-xs" color="muted">
                                                {t("stats.level")} {Math.round(entry.level)}
                                            </Typography>
                                        ) : null}
                                    </div>
                                    <Typography type="body-sm" weight="medium" className="shrink-0">
                                        {t("xpValue", { xp: Math.round(entry.xp).toLocaleString(locale) })}
                                    </Typography>
                                </div>
                            )
                        })}
                    </div>
                </AsyncContent>
            </div>

            {/* badges row — the viewer's earned badges from the real snapshot */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <StarIcon className="size-5 text-accent" aria-hidden focusable="false" />
                    <Typography type="body" weight="medium">
                        {t("badges")}
                    </Typography>
                </div>
                {my && my.badges.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                        {my.badges.map((badge) => (
                            <div
                                key={badge.id}
                                className="flex flex-col items-center gap-2 rounded-2xl bg-default/40 p-4"
                            >
                                <TrophyIcon
                                    className="size-6 text-accent"
                                    weight="fill"
                                    aria-hidden
                                    focusable="false"
                                />
                                <Typography type="body-xs" weight="medium" className="text-center">
                                    {t(`milestones.${badge.badgeKey}.name`)}
                                </Typography>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Typography type="body-sm" color="muted">
                        {t("badgesEmpty")}
                    </Typography>
                )}
            </div>
        </div>
    )
}
