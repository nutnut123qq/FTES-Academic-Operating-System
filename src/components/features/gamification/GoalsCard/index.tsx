"use client"

import React, { useState } from "react"
import {
    Button,
    Chip,
    Input,
    TextField,
    Typography,
    cn,
    toast,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { PencilSimpleIcon, TargetIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useGetMyGoalsSwr } from "@/hooks/swr/api/rest/queries/useGetMyGoalsSwr"
import { usePostPutGoalSwr } from "@/hooks/swr/api/rest/mutations/usePostPutGoalSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import {
    GOAL_METRICS,
    GOAL_PERIODS,
    goalKey,
    parseTarget,
    sortGoals,
    type GoalMetric,
    type GoalPeriod,
} from "./model"

/**
 * "Mục tiêu" block on `/leaderboard`: the learner's configured goals (each a
 * `(period, metric)` pair with a target) plus an upsert form. The backend does
 * NOT return per-goal progress, so the card shows the target the learner set —
 * it never fabricates a completion percentage or bar. Setting a goal for a pair
 * that already exists edits its target (BE `PUT /me/goals` upserts on the pair).
 *
 * @param props - Optional className.
 */
export const GoalsCard = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations("gamification.goals")
    const { data: goals, isLoading, error, mutate } = useGetMyGoalsSwr()
    const { trigger, isMutating } = usePostPutGoalSwr()

    const [period, setPeriod] = useState<GoalPeriod>("WEEKLY")
    const [metric, setMetric] = useState<GoalMetric>("XP")
    const [target, setTarget] = useState("")

    /** Prefill the form from an existing goal so its target can be edited. */
    const editGoal = (p: string, m: string, current: number) => {
        if ((GOAL_PERIODS as ReadonlyArray<string>).includes(p)) setPeriod(p as GoalPeriod)
        if ((GOAL_METRICS as ReadonlyArray<string>).includes(m)) setMetric(m as GoalMetric)
        setTarget(String(current))
    }

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        const parsed = parseTarget(target)
        if (parsed === null) return
        try {
            await trigger({ period, metric, target: parsed })
            await mutate()
            setTarget("")
            toast.success(t("saved"))
        } catch {
            toast.danger(t("saveError"))
        }
    }

    const rows = sortGoals(goals ?? [])

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex items-center gap-2">
                <TargetIcon className="size-5 text-accent" aria-hidden focusable="false" />
                <Typography type="body" weight="medium">
                    {t("title")}
                </Typography>
            </div>

            {/* configured goals — target only, never a fabricated progress bar */}
            <AsyncContent
                isLoading={isLoading && !goals}
                skeleton={
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <Skeleton className="h-16 w-full rounded-2xl" />
                    </div>
                }
                isEmpty={rows.length === 0}
                emptyContent={{ title: t("empty") }}
                error={!goals ? error : undefined}
                errorContent={{ title: t("loadError"), onRetry: () => void mutate(), retryLabel: t("retry") }}
            >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {rows.map((goal) => (
                        <button
                            key={goalKey(goal.period, goal.metric)}
                            type="button"
                            onClick={() => editGoal(goal.period, goal.metric, goal.target)}
                            className="group flex flex-col gap-1 rounded-2xl bg-default/40 p-4 text-left transition-colors hover:bg-default/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                        >
                            <span className="flex items-center gap-2">
                                <Typography type="body-sm" weight="medium">
                                    {t(`metrics.${goal.metric}`)}
                                </Typography>
                                <Chip size="sm" variant="soft" color="default">
                                    <Chip.Label>{t(`periods.${goal.period}`)}</Chip.Label>
                                </Chip>
                                <PencilSimpleIcon
                                    className="ml-auto size-4 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                                    aria-hidden
                                    focusable="false"
                                />
                            </span>
                            <Typography type="body-sm" color="muted">
                                {t("targetValue", { target: goal.target })}
                            </Typography>
                        </button>
                    ))}
                </div>
            </AsyncContent>

            {/* upsert form — pick period + metric, set a target */}
            <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
                <Typography type="body-sm" weight="medium">
                    {t("form.legend")}
                </Typography>

                <div className="flex flex-col gap-1">
                    <Typography type="body-xs" color="muted">
                        {t("form.periodLabel")}
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                        {GOAL_PERIODS.map((option) => (
                            <Button
                                key={option}
                                type="button"
                                size="sm"
                                variant={period === option ? "primary" : "secondary"}
                                aria-pressed={period === option}
                                onPress={() => setPeriod(option)}
                            >
                                {t(`periods.${option}`)}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <Typography type="body-xs" color="muted">
                        {t("form.metricLabel")}
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                        {GOAL_METRICS.map((option) => (
                            <Button
                                key={option}
                                type="button"
                                size="sm"
                                variant={metric === option ? "primary" : "secondary"}
                                aria-pressed={metric === option}
                                onPress={() => setMetric(option)}
                            >
                                {t(`metrics.${option}`)}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <TextField variant="secondary" className="w-32">
                        <Typography type="body-xs" color="muted" className="mb-1 block">
                            {t("form.targetLabel")}
                        </Typography>
                        <Input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            value={target}
                            onChange={(event) => setTarget(event.target.value)}
                            placeholder={t("form.targetPlaceholder")}
                            aria-label={t("form.targetLabel")}
                        />
                    </TextField>
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isDisabled={parseTarget(target) === null || isMutating}
                    >
                        {isMutating ? t("form.submitting") : t("form.submit")}
                    </Button>
                </div>
            </form>
        </div>
    )
}
