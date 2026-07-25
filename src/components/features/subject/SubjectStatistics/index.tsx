"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import {
    ChartLineUpIcon,
    ChatCircleTextIcon,
    DownloadSimpleIcon,
    EyeIcon,
    FolderIcon,
    MedalIcon,
    TrophyIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { MetricCard } from "@/components/blocks/stats/MetricCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { UserLink } from "@/components/features/identity/UserLink"
import {
    useQuerySubjectStatsSwr,
    type SubjectStatUser,
    type SubjectStats,
} from "../hooks/useQuerySubjectStatsSwr"

/**
 * Statistics tab (§3). Every figure is read from the real BE statistics endpoint
 * (`GET /api/v1/subjects/{code}/statistics`, public + Redis-cached): the metric
 * grid (completion rate · members · posts · resources), the top-students and
 * top-contributors boards, the popular-resource rows (each linking to the real
 * `/resources/{id}` page) and the XP leaderboard.
 *
 * Identities are joined in from the subject member list, so a row shows a real
 * name + avatar and links to the profile; unresolved users keep an id-only label
 * instead of a fabricated name. A subject whose worker has not computed a
 * snapshot yet answers all-zero — that is the empty state, not an error.
 */
export const SubjectStatistics = () => {
    const t = useTranslations("subjects")
    const locale = useLocale()
    const { subjectId } = useParams<{ subjectId: string }>()
    const { stats, isLoading, error, mutate } = useQuerySubjectStatsSwr(subjectId)

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Typography type="h5" weight="bold">
                    {t("statistics.title")}
                </Typography>
                {stats?.computedAt ? (
                    <Typography type="body-xs" color="muted">
                        {t("statistics.updatedAt", {
                            time: new Date(stats.computedAt).toLocaleString(locale),
                        })}
                    </Typography>
                ) : null}
            </div>

            <AsyncContent
                isLoading={isLoading && !stats}
                skeleton={<StatisticsSkeleton />}
                isEmpty={Boolean(stats?.isEmpty)}
                emptyContent={{
                    title: t("statistics.empty.title"),
                    description: t("statistics.empty.description"),
                    onRetry: () => {
                        void mutate()
                    },
                    retryLabel: t("statistics.retry"),
                }}
                error={!stats ? error : undefined}
                errorContent={{
                    title: t("statistics.loadError"),
                    onRetry: () => {
                        void mutate()
                    },
                    retryLabel: t("statistics.retry"),
                }}
            >
                {stats ? <StatisticsBoards stats={stats} /> : null}
            </AsyncContent>
        </div>
    )
}

/** Presentation of the loaded statistics. */
const StatisticsBoards = ({ stats }: { stats: SubjectStats }) => {
    const t = useTranslations("subjects")
    const locale = useLocale()

    return (
        <div className="flex flex-col gap-6">
            {/* metric cards — snapshot counters + completion rate */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    icon={<ChartLineUpIcon className="size-5 text-accent" aria-hidden focusable="false" />}
                    value={
                        stats.completionRate === null
                            ? "—"
                            : `${Math.round(stats.completionRate)}%`
                    }
                    label={t("statistics.metrics.completion")}
                    hint={stats.completionRate === null ? t("statistics.notComputed") : undefined}
                />
                <MetricCard
                    icon={<UsersThreeIcon className="size-5 text-accent" aria-hidden focusable="false" />}
                    value={stats.memberCount.toLocaleString(locale)}
                    label={t("statistics.metrics.members")}
                />
                <MetricCard
                    icon={<ChatCircleTextIcon className="size-5 text-accent" aria-hidden focusable="false" />}
                    value={stats.postCount.toLocaleString(locale)}
                    label={t("statistics.metrics.posts")}
                />
                <MetricCard
                    icon={<FolderIcon className="size-5 text-accent" aria-hidden focusable="false" />}
                    value={stats.resourceCount.toLocaleString(locale)}
                    label={t("statistics.metrics.resources")}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* top students — statistics.topStudents[] */}
                <LabeledCard
                    label={t("statistics.topStudents")}
                    icon={<TrophyIcon className="size-4 text-accent" aria-hidden focusable="false" />}
                    fillHeight
                >
                    {stats.topStudents.length === 0 ? (
                        <EmptyContent title={t("statistics.empty.topStudents")} />
                    ) : (
                        <div className="flex flex-col gap-1">
                            {stats.topStudents.map((student, index) => (
                                <StatUserRow
                                    key={student.user.id}
                                    user={student.user}
                                    rank={student.rank || index + 1}
                                    trailing={
                                        <Chip size="sm" variant="soft" color="accent">
                                            {t("statistics.xp", { xp: student.xp.toLocaleString(locale) })}
                                        </Chip>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </LabeledCard>

                {/* top contributors — statistics.topContributors[] */}
                <LabeledCard
                    label={t("statistics.topContributors")}
                    icon={<UsersThreeIcon className="size-4 text-accent" aria-hidden focusable="false" />}
                    fillHeight
                >
                    {stats.topContributors.length === 0 ? (
                        <EmptyContent title={t("statistics.empty.topContributors")} />
                    ) : (
                        <div className="flex flex-col gap-1">
                            {stats.topContributors.map((contributor) => (
                                <StatUserRow
                                    key={contributor.user.id}
                                    user={contributor.user}
                                    trailing={
                                        <Typography type="body-xs" color="muted" className="shrink-0">
                                            {t("statistics.contributions", {
                                                count: contributor.contributions.toLocaleString(locale),
                                            })}
                                        </Typography>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </LabeledCard>

                {/* popular resources — statistics.popularResources[] → /resources/{id} */}
                <LabeledCard
                    label={t("statistics.popularResources")}
                    icon={<FolderIcon className="size-4 text-accent" aria-hidden focusable="false" />}
                    fillHeight
                >
                    {stats.popularResources.length === 0 ? (
                        <EmptyContent title={t("statistics.empty.popularResources")} />
                    ) : (
                        <div className="flex flex-col gap-2">
                            {stats.popularResources.map((resource) => (
                                <div key={resource.id} className="flex items-center gap-3">
                                    <Link
                                        href={`/resources/${resource.id}`}
                                        className="min-w-0 flex-1 truncate text-sm font-medium text-foreground no-underline hover:underline"
                                    >
                                        {resource.title ??
                                            t("statistics.unknownResource", { id: resource.shortId })}
                                    </Link>
                                    <div className="flex shrink-0 items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <EyeIcon
                                                className="size-4 text-muted"
                                                aria-hidden
                                                focusable="false"
                                            />
                                            <Typography type="body-xs" color="muted">
                                                {resource.views.toLocaleString(locale)}
                                            </Typography>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <DownloadSimpleIcon
                                                className="size-4 text-muted"
                                                aria-hidden
                                                focusable="false"
                                            />
                                            <Typography type="body-xs" color="muted">
                                                {resource.downloads.toLocaleString(locale)}
                                            </Typography>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </LabeledCard>

                {/* XP leaderboard — statistics.leaderboard[] */}
                <LabeledCard
                    label={t("statistics.leaderboard")}
                    icon={<MedalIcon className="size-4 text-accent" aria-hidden focusable="false" />}
                    fillHeight
                >
                    {stats.leaderboard.length === 0 ? (
                        <EmptyContent title={t("statistics.empty.leaderboard")} />
                    ) : (
                        <div className="flex flex-col gap-1">
                            {stats.leaderboard.map((row, index) => (
                                <StatUserRow
                                    key={row.user.id}
                                    user={row.user}
                                    rank={row.rank || index + 1}
                                    trailing={
                                        <Typography type="body-sm" weight="semibold" className="shrink-0">
                                            {t("statistics.score", {
                                                score: Math.round(row.score).toLocaleString(locale),
                                            })}
                                        </Typography>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </LabeledCard>
            </div>
        </div>
    )
}

/**
 * One ranked user row: rank badge (when the board is ranked), identity, an
 * optional "you" chip and a trailing metric.
 *
 * The identity comes from the member join — when it resolved, {@link UserLink}
 * renders the real name/avatar and links to the profile; otherwise the row falls
 * back to an id-only label (`#a1b2c3d4`) with a seeded avatar, so nothing is
 * invented and the row still reads as a person.
 */
const StatUserRow = ({
    user,
    rank,
    trailing,
}: {
    user: SubjectStatUser
    rank?: number
    trailing?: React.ReactNode
}) => {
    const t = useTranslations("subjects")

    return (
        <div className="flex items-center gap-3 rounded-2xl px-1 py-1.5">
            {rank ? (
                <div className="flex w-6 shrink-0 justify-center">
                    <Typography type="body-sm" weight="semibold" color="muted">
                        {rank}
                    </Typography>
                </div>
            ) : null}
            <UserLink
                username={user.username}
                displayName={
                    user.displayName ?? t("statistics.unknownMember", { id: user.shortId })
                }
                avatar={user.avatar}
                seed={user.id}
                size="sm"
                className="min-w-0 flex-1"
            />
            {user.isViewer ? (
                <Chip size="sm" variant="soft" color="accent">
                    {t("statistics.you")}
                </Chip>
            ) : null}
            {trailing}
        </div>
    )
}

/** Loading skeleton — mirrors the metric grid + the four board cards. */
const StatisticsSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton.Metric key={index} />
            ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, card) => (
                <div key={card} className="flex flex-col gap-3">
                    <Skeleton.Typography type="h6" width="1/3" />
                    <div className="flex flex-col gap-2 rounded-3xl border border-default p-4">
                        {Array.from({ length: 4 }).map((_, row) => (
                            <Skeleton.UserCell key={row} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
)
