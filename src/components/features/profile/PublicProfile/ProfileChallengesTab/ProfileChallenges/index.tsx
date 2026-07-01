"use client"

import React from "react"
import {
    Label,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    ChartBarIcon,
    PuzzlePieceIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useProfileUsername,
} from "../../hooks/useProfileUsername"
import {
    buildDifficultySegments,
} from "./difficultyMeta"
import {
    groupByCourse,
} from "./groupByCourse"
import {
    ChallengeCourseRow,
} from "./ChallengeCourseRow"
import { useQueryUserChallengeStrengthSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserChallengeStrengthSwr"
import { useQueryUserCoursesSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCoursesSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useQueryUserSolvedChallengesSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserSolvedChallengesSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { MetricCard } from "@/components/blocks/stats/MetricCard"
import { SegmentBar } from "@/components/blocks/stats/SegmentBar"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"
import { getLanguageColor, getLanguageLabel } from "@/modules/utils/language"

/** Props for {@link ProfileChallenges}. */
export type ProfileChallengesProps = WithClassNames<undefined>

/**
 * Challenges tab — the profile owner's graded-challenge proof of work. Leads with
 * a passed count + a 4-tone difficulty {@link SegmentBar} (easy→green /
 * medium→yellow / hard→red / insane→purple), then the submission list rendered as
 * Projects-tab-style rows: one collapsible {@link ChallengeCourseRow} per course
 * (its own difficulty bar + count), expanded on demand to reveal the repo links.
 * Self-contained: reads the username from the route, resolves it to the entity id,
 * and drives its own projection-backed SWR.
 *
 * @param props - optional className for the root element.
 */
export const ProfileChallenges = ({
    className,
}: ProfileChallengesProps) => {
    const t = useTranslations()
    // route carries the username; resolve to the entity id the query keys off
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const {
        data,
        isLoading,
        error,
        mutate,
    } = useQueryUserSolvedChallengesSwr(userId)
    // difficulty-weighted challenge strength: global percentile + rank (null until passed)
    const { data: strength } = useQueryUserChallengeStrengthSwr(userId)
    // joined courses → total challenges per course (for the per-course progress bar)
    const { data: coursesData } = useQueryUserCoursesSwr(userId)
    const totalChallengesByCourse = new Map(
        (coursesData ?? []).map((course) => [course.label, course.challengeTotal]),
    )

    const challenges = data ?? []
    // difficulty distribution across all passed challenges (the headline bar)
    const difficultySegments = buildDifficultySegments(challenges)
    // language breadth: count per language, skipping rows with no language
    const langCounts = challenges.reduce<Record<string, number>>((acc, challenge) => {
        if (!challenge.selectedLang) {
            return acc
        }
        acc[challenge.selectedLang] = (acc[challenge.selectedLang] ?? 0) + 1
        return acc
    }, {})
    const langs = Object.entries(langCounts).sort((a, b) => b[1] - a[1])
    // submission list grouped by course (when the backend resolves titles)
    const groups = groupByCourse(challenges)

    // headline metric row (Coding-tab style): passed + XP + percentile + rank.
    // XP is the REAL ledger sum from the backend (NOT a FE sum of scores).
    const metricStats: Array<{ key: string; value: React.ReactNode }> = [
        { key: "passed", value: challenges.length },
    ]
    if (strength?.xp != null) {
        metricStats.push({ key: "xp", value: strength.xp })
    }
    if (strength?.percentile != null) {
        metricStats.push({ key: "percentile", value: `${strength.percentile}%` })
    }
    if (strength?.rank != null) {
        metricStats.push({ key: "rank", value: `#${strength.rank}` })
    }

    return (
        <AsyncContent
            isLoading={(isLoading || !userId) && challenges.length === 0}
            skeleton={(
                <div className={cn("flex flex-col gap-6", className)}>
                    {/* headline metric row (passed · XP · top · rank) */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[0, 1, 2, 3].map((index) => (
                            <Skeleton key={index} className="h-24 w-full rounded-2xl" />
                        ))}
                    </div>
                    {/* distribution card: difficulty + language as surface list items */}
                    <div className="flex flex-col gap-3">
                        <Skeleton.Typography type="body-sm" width="1/4" />
                        <SurfaceListCard>
                            <SurfaceListCardItem>
                                <Skeleton.SegmentBar legendItems={4} />
                            </SurfaceListCardItem>
                            <SurfaceListCardItem>
                                <Skeleton.SegmentBar legendItems={4} />
                            </SurfaceListCardItem>
                        </SurfaceListCard>
                    </div>
                    {/* submission section — surface list card with course rows */}
                    <div className="flex flex-col gap-3">
                        <Skeleton.Typography type="body-sm" width="1/4" />
                        <SurfaceListCard>
                            {[0, 1, 2].map((row) => (
                                <SurfaceListCardItem key={row}>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-start gap-3">
                                            <Skeleton className="size-12 shrink-0 rounded-xl" />
                                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                                <Skeleton.Typography type="body-sm" width="1/2" />
                                                <Skeleton.ProgressBar />
                                                <Skeleton.Typography type="body-xs" width="1/3" />
                                            </div>
                                        </div>
                                        {/* disclosure link */}
                                        <Skeleton.Typography type="body-sm" width="1/3" />
                                    </div>
                                </SurfaceListCardItem>
                            ))}
                        </SurfaceListCard>
                    </div>
                </div>
            )}
            isEmpty={challenges.length === 0}
            emptyContent={{
                title: t("publicProfile.challengesTab.empty"),
                description: t("publicProfile.challengesTab.emptyHint"),
            }}
            error={challenges.length === 0 ? error : undefined}
            errorContent={{
                title: t("publicProfile.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("publicProfile.loadErrorRetry"),
            }}
        >
            <div className={cn("flex flex-col gap-6", className)}>
                {/* headline metric row (passed · beats X% · rank), Coding-tab style */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {metricStats.map((stat) => (
                        <MetricCard
                            key={stat.key}
                            value={stat.value}
                            label={t(`publicProfile.challengesTab.metric.${stat.key}`)}
                        />
                    ))}
                </div>

                {/* distribution card — by difficulty + by language */}
                <LabeledCard
                    label={t("publicProfile.challengesTab.statsHeading")}
                    icon={<ChartBarIcon aria-hidden focusable="false" className="size-5" />}
                    frameless
                >
                    <SurfaceListCard>
                        {difficultySegments.length > 0 ? (
                            <SurfaceListCardItem>
                                <div className="flex flex-col gap-2">
                                    <Label>{t("publicProfile.challengesTab.difficultyHeading")}</Label>
                                    <SegmentBar
                                        ariaLabel={t("publicProfile.challengesTab.difficultyHeading")}
                                        segments={difficultySegments}
                                    />
                                </div>
                            </SurfaceListCardItem>
                        ) : null}
                        {langs.length > 0 ? (
                            <SurfaceListCardItem>
                                <div className="flex flex-col gap-2">
                                    <Label>{t("publicProfile.challengesTab.languageHeading")}</Label>
                                    {/* same proportion-bar primitive as difficulty above (and the
                                        Overview tab) — length reads better than a donut's angles at
                                        small N; brand colour + label (csharp→C#) via the shared map */}
                                    <SegmentBar
                                        ariaLabel={t("publicProfile.challengesTab.languageHeading")}
                                        segments={langs.map(([lang, count]) => ({
                                            key: lang,
                                            label: getLanguageLabel(lang),
                                            value: count,
                                            color: getLanguageColor(lang),
                                        }))}
                                    />
                                </div>
                            </SurfaceListCardItem>
                        ) : null}
                    </SurfaceListCard>
                </LabeledCard>

                {/* submission list — one collapsible row per course, shared legend at the foot */}
                <LabeledCard
                    label={t("publicProfile.challengesTab.repoHeading")}
                    icon={<PuzzlePieceIcon aria-hidden focusable="false" className="size-5" />}
                    frameless
                >
                    <SurfaceListCard>
                        {groups.map((group, groupIndex) => (
                            <SurfaceListCardItem key={group.courseTitle ?? `__ungrouped-${groupIndex}`}>
                                <ChallengeCourseRow
                                    courseTitle={group.courseTitle}
                                    items={group.items}
                                    totalChallenges={group.courseTitle
                                        ? totalChallengesByCourse.get(group.courseTitle)
                                        : undefined}
                                />
                            </SurfaceListCardItem>
                        ))}
                    </SurfaceListCard>
                </LabeledCard>
            </div>
        </AsyncContent>
    )
}
