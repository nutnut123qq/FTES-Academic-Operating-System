"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon, TargetIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { GOALS } from "../rules"
import { useGamificationEngine } from "../engine"

/** A single goal's rendered state. */
interface GoalRow {
    key: "daily" | "weekly"
    current: number
    target: number
    xp: number
    done: boolean
}

/**
 * "Mục tiêu" block on `/leaderboard`: two cards (Daily / Weekly) showing name,
 * progress (e.g. 1/2, 3/5 days), XP reward and completion state. Progress is
 * exposed as text (not only a bar) so screen readers announce it, and each bar
 * carries `role="progressbar"` with aria value attributes. Reads the shared
 * engine so numbers stay in sync with awards.
 *
 * @param props - Optional className.
 */
export const GoalsCard = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations("gamification")
    const { state } = useGamificationEngine()

    const goals: Array<GoalRow> = [
        {
            key: "daily",
            current: Math.min(state.daily.count, GOALS.daily.target),
            target: GOALS.daily.target,
            xp: GOALS.daily.xp,
            done: state.daily.claimed,
        },
        {
            key: "weekly",
            current: Math.min(state.weekly.days.length, GOALS.weekly.target),
            target: GOALS.weekly.target,
            xp: GOALS.weekly.xp,
            done: state.weekly.claimed,
        },
    ]

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex items-center gap-2">
                <TargetIcon className="size-5 text-accent" aria-hidden focusable="false" />
                <Typography type="body" weight="medium">
                    {t("goals.title")}
                </Typography>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {goals.map((goal) => {
                    const progressText = t(`goals.${goal.key}.progress`, {
                        current: goal.current,
                        target: goal.target,
                    })
                    return (
                        <div key={goal.key} className="flex flex-col gap-2 rounded-large bg-default/40 p-4">
                            <div className="flex items-center gap-2">
                                <Typography type="body-sm" weight="medium">
                                    {t(`goals.${goal.key}.name`)}
                                </Typography>
                                {goal.done ? (
                                    <CheckCircleIcon
                                        className="size-5 text-success"
                                        weight="fill"
                                        aria-label={t("goals.completed")}
                                        focusable="false"
                                    />
                                ) : null}
                                <Typography type="body-xs" color="muted" className="ml-auto">
                                    {t("goals.reward", { xp: goal.xp })}
                                </Typography>
                            </div>
                            <div
                                role="progressbar"
                                aria-valuemin={0}
                                aria-valuemax={goal.target}
                                aria-valuenow={goal.current}
                                aria-valuetext={progressText}
                                className="h-2 w-full overflow-hidden rounded-full bg-default"
                            >
                                <span
                                    className="block h-full rounded-full bg-accent"
                                    style={{ width: `${(goal.current / goal.target) * 100}%` }}
                                />
                            </div>
                            <Typography type="body-xs" color="muted">
                                {progressText}
                            </Typography>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
