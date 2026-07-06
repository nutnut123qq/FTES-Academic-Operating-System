"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryDailyQuestSwr } from "../../hooks/useQueryDailyQuestSwr"

/** Props for {@link DailyQuest}. */
export type DailyQuestProps = WithClassNames<undefined>

/**
 * "Today's quest" content — a toggleable checklist of today's tasks (read a
 * lesson · pass a challenge · review flashcards · ask AI). Toggle state is local
 * (mock, no BE round-trip). Content only (the parent frames it). Self-fetches its
 * own mock leaf query; also shows a done/total summary.
 * @param props - optional root class name (placement only)
 */
export const DailyQuest = ({ className }: DailyQuestProps) => {
    const t = useTranslations("analytics")
    const { tasks, toggle, isLoading, error, mutate } = useQueryDailyQuestSwr()
    const done = tasks.filter((task) => task.done).length

    return (
        <AsyncContent
            isLoading={isLoading || tasks.length === 0}
            error={error}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("overview.retry"),
            }}
            skeleton={(
                <div className="flex flex-col gap-3">
                    {[0, 1, 2, 3].map((row) => (
                        <div key={row} className="flex items-center gap-2">
                            <Skeleton className="size-5 shrink-0 rounded-full" />
                            <Skeleton.Typography type="body-sm" width="1/2" />
                        </div>
                    ))}
                </div>
            )}
        >
            <div className={cn("flex flex-col gap-3", className)}>
                {tasks.map((task) => (
                    <button
                        key={task.key}
                        type="button"
                        onClick={() => toggle(task.key)}
                        aria-pressed={task.done}
                        className="group flex w-full cursor-pointer items-center gap-2 text-left"
                    >
                        {task.done ? (
                            <CheckCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-success" />
                        ) : (
                            <CircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                        )}
                        <Typography
                            type="body-sm"
                            className={cn(
                                "flex-1 truncate transition-colors",
                                task.done ? "text-muted line-through" : "group-hover:text-foreground",
                            )}
                        >
                            {t(`overview.quest.tasks.${task.key}`)}
                        </Typography>
                    </button>
                ))}
                <Typography type="body-xs" color="muted">
                    {t("overview.quest.summary", { done, total: tasks.length })}
                </Typography>
            </div>
        </AsyncContent>
    )
}
