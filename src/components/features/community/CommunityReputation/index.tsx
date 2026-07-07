"use client"

import React from "react"
import { Chip, Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryContributorsSwr } from "../hooks/useQueryContributorsSwr"

/** Loading skeleton — mirrors the ranked contributor rows so the layout never jumps. */
const ReputationSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((index) => (
            <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-separator p-4"
            >
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-32 rounded-full" />
                    <Skeleton className="h-3 w-48 rounded-full" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
        ))}
    </div>
)

/**
 * Community reputation (§6). DEFAULT on-canon layout: a contributor leaderboard
 * showing upvotes / downvotes / accepted-answers. ponytail: rows hand-rolled with
 * a rank badge; mock data. Score = upvotes − downvotes.
 */
export const CommunityReputation = () => {
    const t = useTranslations("communityHub")
    const { contributors, isLoading, error, mutate } = useQueryContributorsSwr()

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h5" weight="bold">
                {t("reputation.title")}
            </Typography>
            <AsyncContent
                isLoading={isLoading && contributors.length === 0}
                skeleton={<ReputationSkeleton />}
                isEmpty={contributors.length === 0}
                emptyContent={{ title: t("reputation.empty") }}
                error={contributors.length === 0 ? error : undefined}
                errorContent={{
                    title: t("reputation.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {contributors.map((contributor, index) => (
                        <div
                            key={contributor.id}
                            className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                        >
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                                {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                                <Typography type="body-sm" weight="medium" truncate>
                                    {contributor.name}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {t("reputation.votes", { up: contributor.upvotes, down: contributor.downvotes })} · {t("reputation.accepted", { count: contributor.accepted })}
                                </Typography>
                            </div>
                            <Chip size="sm" variant="soft" color="accent">
                                {t("reputation.score", { score: contributor.upvotes - contributor.downvotes })}
                            </Chip>
                        </div>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
