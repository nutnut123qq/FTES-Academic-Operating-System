"use client"

import React from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { CheckCircleIcon, CircleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { DAILY_QUEST_ICON_MAP } from "./map"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useQueryDailyQuestSwr } from "../../hooks/useQueryDailyQuestSwr"

/** Props for {@link DailyQuest}. */
export type DailyQuestProps = WithClassNames<undefined>

/**
 * "Nhiệm vụ hôm nay" content — today's daily-quest checklist (read content · pass
 * challenge · review flashcards), each row showing today's progress, plus a claim
 * action that grants the reward once all tasks are done. Content only (the parent
 * `LabeledCard` frames it). Self-fetches the daily-quest leaf query; claiming is a
 * local mock (flips to "claimed").
 * @param props - optional root class name (placement only)
 */
export const DailyQuest = ({ className }: DailyQuestProps) => {
    const t = useTranslations("analytics")
    const { data, claim, isLoading, error, mutate } = useQueryDailyQuestSwr()

    return (
        <AsyncContent
            isLoading={isLoading || !data}
            error={!data ? error : undefined}
            errorContent={{
                title: t("overview.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("overview.retry"),
            }}
            skeleton={(
                <div className="flex flex-col gap-3">
                    {[0, 1, 2].map((row) => (
                        <div key={row} className="flex items-center gap-2">
                            <Skeleton className="size-5 shrink-0 rounded-full" />
                            <Skeleton.Typography type="body-sm" width="1/2" />
                        </div>
                    ))}
                </div>
            )}
        >
            {data ? (
                <div className={cn("flex flex-col gap-3", className)}>
                    {data.tasks.map((task) => {
                        const done = task.current >= task.target
                        return (
                            <div key={task.key} className="flex items-center gap-2">
                                {done ? (
                                    <CheckCircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-success" />
                                ) : (
                                    <CircleIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
                                )}
                                {DAILY_QUEST_ICON_MAP[task.key]}
                                <Typography type="body-sm" className="flex-1 truncate">
                                    {t(`overview.quest.tasks.${task.key}`)}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {task.current}/{task.target}
                                </Typography>
                            </div>
                        )
                    })}

                    {/* claim state: already claimed · ready to claim · still in progress */}
                    {data.claimed ? (
                        <Chip color="success" variant="soft" size="sm" className="self-start">
                            <Chip.Label>{t("overview.quest.claimed")}</Chip.Label>
                        </Chip>
                    ) : data.allDone ? (
                        <Button
                            variant="primary"
                            size="sm"
                            className="self-start"
                            onPress={claim}
                        >
                            {t("overview.quest.claim", { count: data.reward })}
                        </Button>
                    ) : (
                        <Typography type="body-xs" color="muted">
                            {t("overview.quest.completePrompt", { count: data.reward })}
                        </Typography>
                    )}
                </div>
            ) : null}
        </AsyncContent>
    )
}
