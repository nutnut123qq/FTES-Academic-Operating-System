"use client"

import React from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryGroupChallengesSwr } from "../hooks/useQueryGroupChallengesSwr"

/** Loading skeleton — mirrors a challenge row (title + type + status chip + join). */
const GroupChallengeSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
            <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-separator p-4"
            >
                <div className="min-w-0 flex-1">
                    <Skeleton.Typography type="body-sm" width="1/2" />
                    <Skeleton.Typography type="body-xs" width="1/4" />
                </div>
                <Skeleton.Chip className="shrink-0" />
                <Skeleton.Button width="w-16" className="shrink-0" />
            </div>
        ))}
    </div>
)

/**
 * Group challenges (§7/§10). DEFAULT on-canon layout: a list of active challenges
 * with a join action. Renders inside the group shell (which owns the container +
 * padding + group header), so this body stays flat like its sibling tabs. The
 * list is wired to the real group REST API (read-only bridge to challenge.api).
 */
export const GroupChallenge = () => {
    const t = useTranslations("groupsHub")
    const router = useRouter()
    const { groupId } = useParams<{ groupId: string }>()
    const { challenges, isLoading, error, mutate } = useQueryGroupChallengesSwr(groupId)

    // Map raw BE enum tokens (type/status) through i18n, falling back to the token
    // when the BE emits an enum value we don't yet have a translation for.
    const typeLabel = (type: string) =>
        t.has(`challenges.type.${type}`) ? t(`challenges.type.${type}`) : type
    const statusLabel = (status: string) =>
        t.has(`challenges.status.${status}`) ? t(`challenges.status.${status}`) : status

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h6" weight="bold">
                {t("challenges.title")}
            </Typography>
            <AsyncContent
                isLoading={isLoading && challenges.length === 0}
                skeleton={<GroupChallengeSkeleton />}
                isEmpty={challenges.length === 0}
                emptyContent={{ title: t("challenges.empty") }}
                error={challenges.length === 0 ? error : undefined}
                errorContent={{
                    title: t("challenges.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
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
                                    {typeLabel(challenge.type)}
                                </Typography>
                            </div>
                            <Chip size="sm" variant="soft" color="accent">
                                {statusLabel(challenge.status)}
                            </Chip>
                            {/* the group bridge is read-only: participating happens on the
                                challenge itself, so this navigates to the (slug-addressed)
                                challenge page where the real join/submit flow lives */}
                            <Button
                                size="sm"
                                variant="secondary"
                                onPress={() => router.push(`/challenges/${challenge.slug}`)}
                            >
                                {t("challenges.join")}
                            </Button>
                        </div>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
