"use client"

import React, {
    useCallback,
} from "react"
import {
    Button,
    Chip,
    Typography,
    cn,
} from "@heroui/react"
import {
    CheckCircleIcon,
    CircleIcon,
} from "@phosphor-icons/react"
import {
    useTranslations,
} from "next-intl"
import {
    useSWRConfig,
} from "swr"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    DAILY_QUEST_ICON_MAP,
} from "./map"
import { useQueryMyDailyQuestSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyDailyQuestSwr"
import { useMutateClaimDailyQuestRewardSwr } from "@/hooks/swr/api/graphql/mutations/useMutateClaimDailyQuestRewardSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useGraphQLWithToast } from "@/modules/toast/hooks"

/** Props for {@link DailyQuest}. */
export type DailyQuestProps = WithClassNames<undefined>

/**
 * "Nhiệm vụ hôm nay" content — today's daily-quest checklist (read content · pass
 * challenge · review flashcards), each row showing today's progress, plus a claim
 * action that grants the reward once all tasks are done. Content only (the parent
 * {@link import("@/components/blocks").LabeledCard} frames it). Self-fetches the
 * daily-quest leaf query; claiming refetches the quest + reward wallet.
 * @param props - optional root class name (placement only)
 */
export const DailyQuest = ({
    className,
}: DailyQuestProps) => {
    const t = useTranslations()
    const { mutate: globalMutate } = useSWRConfig()
    const runGraphQL = useGraphQLWithToast()
    const {
        data,
        isLoading,
        error,
        mutate,
    } = useQueryMyDailyQuestSwr()
    const { trigger, isMutating } = useMutateClaimDailyQuestRewardSwr()

    /** Claim today's reward, then refresh the quest + the reward-balance chip. */
    const onClaim = useCallback(
        async () => {
            const ok = await runGraphQL(async () => {
                const result = await trigger()
                return result.data!.claimDailyQuestReward
            })
            if (ok) {
                await mutate()
                // reward balance changed → refresh the identity standing chip
                await globalMutate(["QUERY_MY_REWARD_WALLET_SWR"])
            }
        },
        [
            runGraphQL,
            trigger,
            mutate,
            globalMutate,
        ],
    )

    return (
        <AsyncContent
            isLoading={data === null || data === undefined || isLoading}
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
            isEmpty={!data}
            error={!data ? error : undefined}
            errorContent={{
                title: t("dashboard.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("dashboard.retry"),
            }}
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
                                    {t(`dashboard.dailyQuest.tasks.${task.key}`)}
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
                            <Chip.Label>{t("dashboard.dailyQuest.claimed")}</Chip.Label>
                        </Chip>
                    ) : data.allDone ? (
                        <Button
                            variant="primary"
                            size="sm"
                            className="self-start"
                            isPending={isMutating}
                            onPress={onClaim}
                        >
                            {t("dashboard.dailyQuest.claim", { count: data.reward })}
                        </Button>
                    ) : (
                        <Typography type="body-xs" color="muted">
                            {t("dashboard.dailyQuest.completePrompt", { count: data.reward })}
                        </Typography>
                    )}
                </div>
            ) : null}
        </AsyncContent>
    )
}
