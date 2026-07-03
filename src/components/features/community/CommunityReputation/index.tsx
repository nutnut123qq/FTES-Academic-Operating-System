"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useQueryContributorsSwr } from "../hooks/useQueryContributorsSwr"

/**
 * Community reputation (§6). DEFAULT on-canon layout: a contributor leaderboard
 * showing upvotes / downvotes / accepted-answers. ponytail: rows hand-rolled with
 * a rank badge; mock data. Score = upvotes − downvotes.
 */
export const CommunityReputation = () => {
    const t = useTranslations("communityHub")
    const { contributors } = useQueryContributorsSwr()

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h5" weight="bold">
                {t("reputation.title")}
            </Typography>
            {contributors.map((contributor, index) => (
                <div
                    key={contributor.id}
                    className="flex items-center gap-3 rounded-large border border-separator p-4"
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
    )
}
