"use client"

import React from "react"
import { Chip, Typography, cn } from "@heroui/react"
import { useLocale, useTranslations } from "next-intl"
import { TrophyIcon } from "@phosphor-icons/react"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { InitialsAvatar } from "@/components/blocks/identity/InitialsAvatar"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { TopLearnersSkeleton } from "./TopLearnersSkeleton"
import { useQueryDashboardCommunityBoardSwr } from "../../hooks/useQueryDashboardCommunityBoardSwr"

/** Props for {@link TopLearners}. */
export type TopLearnersProps = WithClassNames<undefined>

/**
 * Dashboard "Top học viên" card — the platform's highest-scoring learners from the real
 * global gamification board, with the viewer's own row highlighted in place and their
 * standing summarised in a header above the list.
 *
 * Every value is backend data: rank, display name and season XP. Two things the backend
 * does NOT provide are therefore absent by design rather than filled in — per-user LEVEL
 * (the entry carries none, so no level sub-line is rendered) and a "my rank" for a viewer
 * outside the fetched top-20 (the standing header simply does not render). The board rides
 * a per-season Redis ZSET that is empty until XP is awarded, so the empty state is a normal
 * resting state and gets a real message instead of sample rows.
 *
 * Self-fetches its own leaf query (shared cache with `/leaderboard`) and owns its four
 * states through {@link AsyncContent}; the label row links on to the full board.
 *
 * @param props - optional root class name (placement only)
 */
export const TopLearners = ({ className }: TopLearnersProps) => {
    const t = useTranslations("dashboard")
    const locale = useLocale()
    const router = useRouter()
    const {
        leaders,
        standing,
        myUserId,
        isEmpty,
        isLoading,
        error,
        mutate,
    } = useQueryDashboardCommunityBoardSwr()

    return (
        <LabeledCard
            className={className}
            label={t("community.topLearners.title")}
            icon={<TrophyIcon aria-hidden focusable="false" className="size-5" />}
            onSeeMore={() => router.push("/leaderboard")}
            seeMoreLabel={t("community.globalStanding.seeMore")}
            // the list is itself a card → render it bare, no card-in-card
            frameless
        >
            <AsyncContent
                isLoading={isLoading && leaders.length === 0}
                skeleton={<TopLearnersSkeleton />}
                isEmpty={isEmpty}
                emptyContent={{
                    title: t("community.topLearners.emptyTitle"),
                    description: t("community.topLearners.emptyDescription"),
                    icon: <TrophyIcon aria-hidden focusable="false" className="size-8 text-muted" />,
                }}
                error={leaders.length === 0 ? error : undefined}
                errorContent={{
                    title: t("community.topLearners.error"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {/* standing header — only when the viewer is actually ON the fetched
                        board; the BE exposes no rank for anyone below its top-20 cap. */}
                    {standing ? (
                        <div className="flex items-center gap-3">
                            <IconTile
                                icon={<TrophyIcon weight="fill" aria-hidden focusable="false" />}
                                tone="accent"
                                size="sm"
                            />
                            <div className="flex min-w-0 flex-col gap-0">
                                <Typography type="body-sm" weight="medium">
                                    {t("community.globalStanding.title")}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {t("community.globalStanding.line", {
                                        rank: standing.rank,
                                        points: Math.round(standing.xp).toLocaleString(locale),
                                    })}
                                </Typography>
                            </div>
                        </div>
                    ) : null}

                    <SurfaceListCard>
                        {leaders.map((entry) => {
                            const isMe = entry.id === myUserId
                            return (
                                <SurfaceListCardItem
                                    key={entry.id}
                                    className={cn(isMe && "bg-accent/10")}
                                >
                                    <div className="flex items-center gap-3">
                                        <Typography
                                            type="body-sm"
                                            weight="bold"
                                            className={cn(
                                                "w-8 shrink-0 tabular-nums",
                                                isMe ? "text-accent" : "text-muted",
                                            )}
                                        >
                                            {t("rank", { rank: entry.rank })}
                                        </Typography>
                                        {/* initials tile — the BE entry carries an avatar URL but the
                                            shared board hook maps initials only, so no image is claimed.
                                            Decorative: the name is rendered right beside it. */}
                                        <InitialsAvatar initials={entry.avatarInitials} />
                                        <Typography
                                            type="body-sm"
                                            weight="medium"
                                            truncate
                                            className="min-w-0 flex-1"
                                        >
                                            {entry.name}
                                        </Typography>
                                        {isMe ? (
                                            <Chip size="sm" variant="soft" color="accent">
                                                <Chip.Label>{t("community.topLearners.you")}</Chip.Label>
                                            </Chip>
                                        ) : null}
                                        <Typography
                                            type="body-sm"
                                            weight="medium"
                                            className="shrink-0 tabular-nums"
                                        >
                                            {t("community.topLearners.xp", {
                                                points: Math.round(entry.xp).toLocaleString(locale),
                                            })}
                                        </Typography>
                                        {/* no level line: the BE leaderboard entry has no level */}
                                    </div>
                                </SurfaceListCardItem>
                            )
                        })}
                    </SurfaceListCard>
                </div>
            </AsyncContent>
        </LabeledCard>
    )
}
