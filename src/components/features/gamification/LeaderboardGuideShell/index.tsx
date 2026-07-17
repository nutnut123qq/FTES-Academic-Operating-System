"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { ArrowLeftIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import { RANK_TIERS } from "../leaderboardTiers"

// Gamification economics for the "Cách tính điểm" explainer. These display
// constants mirror the backend `gamification-quest-coin-engine` config; with the
// mock engine removed the guide is their only consumer, so they live here. The
// live viewer numbers come from `useQueryMyGamificationSwr` and tiers from
// `leaderboardTiers.ts` — there is no BE explainer endpoint, so this page is the
// human-readable contract for the numbers.

/** Level curve: total XP to REACH level L is `factor × (L − 1)²`. */
const LEVEL_CURVE = { factor: 35 } as const
/** Total XP required to reach a given level: `factor × (L − 1)²`. */
const xpForLevel = (level: number): number =>
    LEVEL_CURVE.factor * Math.pow(Math.max(1, level) - 1, 2)
/** Quiz XP by score band (descending by threshold). */
const QUIZ_XP_TIERS: ReadonlyArray<{ minPercent: number; xp: number }> = [
    { minPercent: 100, xp: 50 },
    { minPercent: 85, xp: 35 },
    { minPercent: 60, xp: 20 },
    { minPercent: 0, xp: 10 },
]
/** Streak XP multiplier: +5%/day, capped at +50%. */
const STREAK_MULTIPLIER_STEP = 0.05
const STREAK_MULTIPLIER_CAP = 0.5
/** Streak Freeze: hold at most 2, buy one for 50 coin. */
const FREEZE = { max: 2, cost: 50 } as const
/** Streak Repair: within 48h of a reset, 10 coin/day, capped at 200. */
const REPAIR = { windowHours: 48, costPerDay: 10, costCap: 200 } as const
/** Streak-at-risk reminder: fires at 20:00 local when the streak is ≥ 3. */
const REMINDER = { hour: 20, minStreak: 3 } as const
/** Daily/Weekly goal targets and their XP rewards. */
const GOALS = {
    daily: { target: 2, xp: 10 },
    weekly: { target: 5, xp: 50 },
} as const
/** One-time streak milestones (badge + coin). */
const STREAK_MILESTONES: ReadonlyArray<{ days: number; badgeKey: string; coin: number }> = [
    { days: 7, badgeKey: "weekOfFire", coin: 50 },
    { days: 30, badgeKey: "monthOfGrit", coin: 200 },
    { days: 100, badgeKey: "hundredDays", coin: 1000 },
]

/** A row in the XP table. `xp` null → the value is score-banded (shown inline). */
interface XpRow {
    key: string
    xp: number | null
}

/**
 * "Cách tính điểm" — the gamification rules explainer at `/leaderboard/guide`.
 *
 * Every number renders from the local economics constants above (the display
 * contract mirroring the backend engine config): the XP
 * table, the level-curve formula + worked example, the rank tiers, the streak
 * rules (qualifying day / multiplier / milestones / freeze / repair / reminder),
 * the Daily/Weekly goals, and a "Sắp ra mắt" (coming soon) section that only
 * outlines League/Season, Monthly goal and Mystery Box with no live numbers.
 *
 * Headings are properly nested (h1 → h2) and every table has header cells for a11y.
 */
export const LeaderboardGuideShell = () => {
    const t = useTranslations("gamification")
    const locale = useLocale()

    const xpRows: Array<XpRow> = [
        { key: "lessonComplete", xp: 20 },
        { key: "quizSubmit", xp: null },
        { key: "challengeComplete", xp: 40 },
        { key: "dailyLogin", xp: 5 },
        { key: "postUpvote", xp: 2 },
        { key: "commentUpvote", xp: 1 },
        { key: "dailyGoal", xp: 10 },
        { key: "weeklyGoal", xp: 50 },
    ]

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6">
            <div className="flex flex-col gap-2">
                <Link
                    href={pathConfig().locale(locale).leaderboard().build()}
                    className="flex w-fit items-center gap-1 text-sm text-muted no-underline hover:text-foreground"
                >
                    <ArrowLeftIcon className="size-4" aria-hidden focusable="false" />
                    {t("guide.back")}
                </Link>
                <div className="flex flex-col gap-0">
                    <Typography.Heading level={1} weight="bold" className="text-2xl">
                        {t("guide.title")}
                    </Typography.Heading>
                    <Typography type="body-sm" color="muted">
                        {t("guide.subtitle")}
                    </Typography>
                </div>
            </div>

            {/* XP table */}
            <section className="flex flex-col gap-3">
                <Typography.Heading level={2} weight="bold" className="text-lg">
                    {t("guide.xpSection")}
                </Typography.Heading>
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-separator text-left text-muted">
                            <th scope="col" className="py-2 font-medium">
                                {t("guide.actionHeader")}
                            </th>
                            <th scope="col" className="py-2 text-right font-medium">
                                {t("guide.xpHeader")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {xpRows.map((row) => (
                            <tr key={row.key} className="border-b border-separator/60">
                                <th scope="row" className="py-2 pr-3 text-left font-normal">
                                    {t(`guide.actions.${row.key}`)}
                                </th>
                                <td className="py-2 text-right font-medium">
                                    {row.xp === null
                                        ? t("guide.quizBanded")
                                        : t("xpValue", { xp: row.xp })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Typography type="body-xs" color="muted">
                    {t("guide.multiplierNote")}
                </Typography>
                {/* Quiz score bands */}
                <div className="flex flex-wrap gap-2">
                    {QUIZ_XP_TIERS.slice().reverse().map((band) => (
                        <span
                            key={band.minPercent}
                            className="rounded-medium bg-default/40 px-2 py-1 text-xs"
                        >
                            {t("guide.quizBand", { min: band.minPercent, xp: band.xp })}
                        </span>
                    ))}
                </div>
            </section>

            {/* Level curve */}
            <section className="flex flex-col gap-2">
                <Typography.Heading level={2} weight="bold" className="text-lg">
                    {t("guide.levelSection")}
                </Typography.Heading>
                <Typography type="body-sm">
                    {t("guide.levelFormula", { factor: LEVEL_CURVE.factor })}
                </Typography>
                <Typography type="body-sm" color="muted">
                    {t("guide.levelExample", {
                        level: 13,
                        xp: xpForLevel(13).toLocaleString(locale),
                    })}
                </Typography>
            </section>

            {/* Rank tiers */}
            <section className="flex flex-col gap-3">
                <Typography.Heading level={2} weight="bold" className="text-lg">
                    {t("guide.tierSection")}
                </Typography.Heading>
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="border-b border-separator text-left text-muted">
                            <th scope="col" className="py-2 font-medium">
                                {t("guide.tierHeader")}
                            </th>
                            <th scope="col" className="py-2 text-right font-medium">
                                {t("guide.tierXpHeader")}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {RANK_TIERS.map((tier) => (
                            <tr key={tier.key} className="border-b border-separator/60">
                                <th scope="row" className="py-2 pr-3 text-left font-normal">
                                    {t(`tiers.${tier.key}`)}
                                </th>
                                <td className="py-2 text-right font-medium">
                                    {t("guide.tierFrom", { xp: tier.minXp.toLocaleString(locale) })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Streak rules */}
            <section className="flex flex-col gap-2">
                <Typography.Heading level={2} weight="bold" className="text-lg">
                    {t("guide.streakSection")}
                </Typography.Heading>
                <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
                    <li>{t("guide.streakQualifying")}</li>
                    <li>
                        {t("guide.streakMultiplier", {
                            step: Math.round(STREAK_MULTIPLIER_STEP * 100),
                            cap: Math.round(STREAK_MULTIPLIER_CAP * 100),
                        })}
                    </li>
                    <li>{t("guide.streakReset")}</li>
                    <li>{t("guide.streakFreeze", { max: FREEZE.max, cost: FREEZE.cost })}</li>
                    <li>
                        {t("guide.streakRepair", {
                            window: REPAIR.windowHours,
                            perDay: REPAIR.costPerDay,
                            cap: REPAIR.costCap,
                        })}
                    </li>
                    <li>{t("guide.streakReminder", { hour: REMINDER.hour, min: REMINDER.minStreak })}</li>
                </ul>
                {/* Milestones */}
                <div className="mt-2 flex flex-col gap-2">
                    {STREAK_MILESTONES.map((milestone) => (
                        <Typography key={milestone.days} type="body-sm" color="muted">
                            {t("guide.milestoneRow", {
                                days: milestone.days,
                                name: t(`milestones.${milestone.badgeKey}.name`),
                                coin: milestone.coin,
                            })}
                        </Typography>
                    ))}
                </div>
            </section>

            {/* Goals */}
            <section className="flex flex-col gap-2">
                <Typography.Heading level={2} weight="bold" className="text-lg">
                    {t("guide.goalsSection")}
                </Typography.Heading>
                <Typography type="body-sm">
                    {t("guide.dailyGoalRule", { target: GOALS.daily.target, xp: GOALS.daily.xp })}
                </Typography>
                <Typography type="body-sm">
                    {t("guide.weeklyGoalRule", { target: GOALS.weekly.target, xp: GOALS.weekly.xp })}
                </Typography>
            </section>

            {/* Coming soon */}
            <section className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                <Typography.Heading level={2} weight="bold" className="text-lg">
                    {t("guide.comingSoonSection")}
                </Typography.Heading>
                <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted">
                    <li>{t("guide.comingSoon.league")}</li>
                    <li>{t("guide.comingSoon.monthly")}</li>
                    <li>{t("guide.comingSoon.mysteryBox")}</li>
                </ul>
            </section>
        </div>
    )
}
