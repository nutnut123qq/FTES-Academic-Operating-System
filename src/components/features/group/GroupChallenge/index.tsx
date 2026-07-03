"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryGroupChallengesSwr } from "../hooks/useQueryGroupChallengesSwr"

/**
 * Group challenges (§7/§10). DEFAULT on-canon layout: a list of active challenges
 * with a join action. ponytail: rows hand-rolled; mock data; join is a no-op.
 */
export const GroupChallenge = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { challenges } = useQueryGroupChallengesSwr(groupId)

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
            <Typography type="h4" weight="bold">
                {t("challenges.title")}
            </Typography>
            {challenges.map((challenge) => (
                <div
                    key={challenge.id}
                    className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                >
                    <div className="min-w-0 flex-1">
                        <Typography type="body-sm" weight="medium" truncate>
                            {challenge.title}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {challenge.deadlineLabel}
                        </Typography>
                    </div>
                    <Chip size="sm" variant="soft" color="accent">
                        {t("challenges.participants", { count: challenge.participants })}
                    </Chip>
                    <Button size="sm" variant="secondary">
                        {t("challenges.join")}
                    </Button>
                </div>
            ))}
        </div>
    )
}
