"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { FireIcon, LightningIcon, RankingIcon, StarIcon, TrophyIcon } from "@phosphor-icons/react"
import { CURRENT_USER_ID, useQueryLeaderboardSwr } from "../hooks/useQueryLeaderboardSwr"

/**
 * Gamification leaderboard + progression surface (§11) — the `/leaderboard` page.
 * A dashboard: top stat cards (XP · Level · Streak · Rank), a ranked leaderboard
 * list with the current user highlighted, and a badges row (earned vs locked).
 * Feature owns data (mock); tokens own the look. ponytail: hand-rolled metric
 * cards + rows, mock data.
 */
export const LeaderboardShell = () => {
    const t = useTranslations("gamification")
    const { me, board, badges } = useQueryLeaderboardSwr()

    const stats = [
        { key: "xp", icon: <LightningIcon className="size-5" />, value: me?.xp ?? 0 },
        { key: "level", icon: <StarIcon className="size-5" />, value: me?.level ?? 0 },
        { key: "streak", icon: <FireIcon className="size-5" />, value: me?.streak ?? 0 },
        { key: "rank", icon: <RankingIcon className="size-5" />, value: me?.rank ?? 0 },
    ] as const

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
            <div className="flex flex-col gap-1">
                <Typography type="h4" weight="bold">
                    {t("title")}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("subtitle")}
                </Typography>
            </div>

            {/* stat cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.key} className="flex flex-col gap-2 rounded-large bg-default/40 p-4">
                        <div className="flex items-center gap-2 text-muted">
                            {stat.icon}
                            <Typography type="body-xs" color="muted">
                                {t(`stats.${stat.key}`)}
                            </Typography>
                        </div>
                        <Typography type="h5" weight="bold">
                            {Math.round(stat.value).toLocaleString()}
                        </Typography>
                    </div>
                ))}
            </div>

            {/* leaderboard list */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <TrophyIcon className="size-5 text-accent" />
                    <Typography type="body" weight="medium">
                        {t("leaderboard")}
                    </Typography>
                </div>
                <div className="flex flex-col gap-2">
                    {board.map((entry, index) => {
                        const isMe = entry.id === CURRENT_USER_ID
                        return (
                            <div
                                key={entry.id}
                                className={`flex items-center gap-3 rounded-large border border-separator p-3 ${
                                    isMe ? "bg-accent/10" : ""
                                }`}
                            >
                                <Typography
                                    type="body-sm"
                                    weight="bold"
                                    className={`w-6 shrink-0 text-center ${isMe ? "text-accent" : "text-muted"}`}
                                >
                                    {index + 1}
                                </Typography>
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                                    {entry.avatarInitials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {entry.name}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {t("stats.level")} {Math.round(entry.level)}
                                    </Typography>
                                </div>
                                <Typography type="body-sm" weight="medium" className="shrink-0">
                                    {t("xpValue", { xp: Math.round(entry.xp).toLocaleString() })}
                                </Typography>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* badges row */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <StarIcon className="size-5 text-accent" />
                    <Typography type="body" weight="medium">
                        {t("badges")}
                    </Typography>
                </div>
                <div className="flex flex-wrap gap-3">
                    {badges.map((badge) => (
                        <div
                            key={badge.id}
                            className={`flex flex-col items-center gap-2 rounded-large bg-default/40 p-4 ${
                                badge.earned ? "" : "opacity-50"
                            }`}
                        >
                            <TrophyIcon
                                className={`size-6 ${badge.earned ? "text-accent" : "text-muted"}`}
                                weight={badge.earned ? "fill" : "regular"}
                            />
                            <Typography type="body-xs" weight="medium" className="text-center">
                                {badge.name}
                            </Typography>
                            {!badge.earned ? (
                                <Chip size="sm" variant="soft" color="default">
                                    {t("badgeLocked")}
                                </Chip>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
