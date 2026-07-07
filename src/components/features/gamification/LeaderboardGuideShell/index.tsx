"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { ArrowLeftIcon } from "@phosphor-icons/react"
import { Link } from "@/i18n/navigation"
import { pathConfig } from "@/resources/path"
import {
    FREEZE,
    GOALS,
    LEVEL_CURVE,
    QUIZ_XP_TIERS,
    RANK_TIERS,
    REMINDER,
    REPAIR,
    STREAK_MILESTONES,
    STREAK_MULTIPLIER_CAP,
    STREAK_MULTIPLIER_STEP,
    XP_TABLE,
    GamificationActionType,
    xpForLevel,
} from "../rules"

/** A row in the XP table. `xp` null → the value is score-banded (shown inline). */
interface XpRow {
    key: string
    xp: number | null
}

/**
 * "Cách tính điểm" — the gamification rules explainer at `/leaderboard/guide`.
 *
 * Every number renders from `rules.ts` (the single source of truth): the XP
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
        { key: "lessonComplete", xp: XP_TABLE[GamificationActionType.LessonComplete] },
        { key: "quizSubmit", xp: null },
        { key: "challengeComplete", xp: XP_TABLE[GamificationActionType.ChallengeComplete] },
        { key: "dailyLogin", xp: XP_TABLE[GamificationActionType.DailyLogin] },
        { key: "postUpvote", xp: XP_TABLE[GamificationActionType.PostUpvote] },
        { key: "commentUpvote", xp: XP_TABLE[GamificationActionType.CommentUpvote] },
        { key: "dailyGoal", xp: XP_TABLE[GamificationActionType.DailyGoal] },
        { key: "weeklyGoal", xp: XP_TABLE[GamificationActionType.WeeklyGoal] },
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
