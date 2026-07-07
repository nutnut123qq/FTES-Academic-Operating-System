"use client"

import React, { useEffect } from "react"
import { Button, Chip, Skeleton, Typography, toast } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { FireIcon, LightningIcon, RankingIcon, StarIcon, TrophyIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryLeaderboardSwr } from "../hooks/useQueryLeaderboardSwr"
import {
    GamificationActionType,
    STREAK_MILESTONES,
    tierFromXp,
    xpToNextLevel,
} from "../rules"
import { useGamificationEngine } from "../engine"
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
 * A dashboard driven by the deterministic mock engine (single source of truth in
 * `rules.ts` + `engine.ts`): stat cards (XP · Level · Streak · Rank+tier) where
 * the Streak card opens the detail popover; a "Cách tính điểm" guide link; a
 * ranked board; the Daily/Weekly goals block; and a milestone-badge row wired to
 * the engine's claimed milestones. A small demo row fires mock learning actions
 * so the +XP toast / level-up moment / streak increment are observable without a
 * backend. The engine store is shared, so every surface updates in lockstep.
 */
export const LeaderboardShell = () => {
    const t = useTranslations("gamification")
    const locale = useLocale()
    const { board, myUserId, isLoading, error, mutate } = useQueryLeaderboardSwr()
    const { state, level, recordAction, checkDayRollover } = useGamificationEngine()

    // On mount, roll the day forward (consume freezes / reset) and fire the
    // 20:00 streak-at-risk reminder once/day — best-effort while the app is open.
    // A real BE would push this to the notification bell; here it surfaces as a
    // non-blocking status toast (that shared bell feature is owned elsewhere).
    useEffect(() => {
        const { remind, streak } = checkDayRollover()
        if (remind) {
            // HeroUI's toast region is an aria-live status landmark, so screen
            // readers announce this without a per-toast role.
            toast.warning(t("reminder.title"), {
                description: t("reminder.body", { count: streak }),
            })
        }
    }, [checkDayRollover, t])

    const { tier } = tierFromXp(state.xp)
    const toNext = xpToNextLevel(state.xp)
    // Guide is a child route of /leaderboard. pathConfig has no dedicated
    // builder for it (shared file, owned elsewhere); derive it from the
    // leaderboard base rather than hand-templating the whole path.
    const guideHref = `${pathConfig().locale(locale).leaderboard().build()}/guide`

    const stats = [
        {
            key: "xp" as const,
            icon: <LightningIcon className="size-5" aria-hidden focusable="false" />,
            value: state.xp,
            hint: undefined as string | undefined,
        },
        {
            key: "level" as const,
            icon: <StarIcon className="size-5" aria-hidden focusable="false" />,
            value: level,
            hint: t("levelHint", { xp: toNext.toLocaleString(locale) }),
        },
        {
            key: "streak" as const,
            icon: <FireIcon className="size-5" aria-hidden focusable="false" />,
            value: state.streak,
            hint: undefined,
        },
        {
            key: "rank" as const,
            icon: <RankingIcon className="size-5" aria-hidden focusable="false" />,
            value: board.findIndex((entry) => entry.id === myUserId) + 1,
            hint: t(`tiers.${tier.key}`),
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
                                    unranked (e.g. the board is empty / unseeded) instead of "0". */}
                                {stat.key === "rank" && stat.value < 1
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

            {/* demo: fire mock learning actions to exercise the engine (award/streak/toast) */}
            <div className="flex flex-wrap items-center gap-2 rounded-large border border-dashed border-separator p-3">
                <Typography type="body-xs" color="muted" className="mr-1">
                    {t("demo.label")}
                </Typography>
                <Button size="sm" variant="secondary" onPress={() => recordAction(GamificationActionType.LessonComplete)}>
                    {t("demo.lesson")}
                </Button>
                <Button
                    size="sm"
                    variant="secondary"
                    onPress={() => recordAction(GamificationActionType.QuizSubmit, { scorePercent: 90 })}
                >
                    {t("demo.quiz")}
                </Button>
                <Button size="sm" variant="secondary" onPress={() => recordAction(GamificationActionType.ChallengeComplete)}>
                    {t("demo.challenge")}
                </Button>
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

            {/* badges row — streak-milestone badges reflect the engine's claimed set */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <StarIcon className="size-5 text-accent" aria-hidden focusable="false" />
                    <Typography type="body" weight="medium">
                        {t("badges")}
                    </Typography>
                </div>
                <div className="flex flex-wrap gap-3">
                    {STREAK_MILESTONES.map((milestone) => {
                        const earned = state.claimedMilestones.includes(milestone.days)
                        return (
                            <div
                                key={milestone.days}
                                className={`flex flex-col items-center gap-2 rounded-2xl bg-default/40 p-4 ${
                                    earned ? "" : "opacity-50"
                                }`}
                            >
                                <TrophyIcon
                                    className={`size-6 ${earned ? "text-accent" : "text-muted"}`}
                                    weight={earned ? "fill" : "regular"}
                                    aria-hidden
                                    focusable="false"
                                />
                                <Typography type="body-xs" weight="medium" className="text-center">
                                    {t(`milestones.${milestone.badgeKey}.name`)}
                                </Typography>
                                {!earned ? (
                                    <Chip size="sm" variant="soft" color="default">
                                        {t("badgeLocked")}
                                    </Chip>
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
