"use client"

import React from "react"
import {
    cn,
    Skeleton,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useProfileUsername,
} from "../useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryUserCodingHistorySwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCodingHistorySwr"
import { useQueryUserCodingProgressSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCodingProgressSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { DifficultyChip, type Difficulty } from "@/components/blocks/chips/DifficultyChip"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { MetricCard } from "@/components/blocks/stats/MetricCard"
import { StatusChip } from "@/components/blocks/chips/StatusChip"

/** Props for {@link ProfileCoding}. */
export type ProfileCodingProps = WithClassNames<undefined>

/** Map a raw history difficulty value onto a {@link DifficultyChip} level. */
const DIFFICULTY_LEVEL: Record<string, Difficulty> = {
    easy: "beginner",
    medium: "intermediate",
    hard: "advanced",
    insane: "insane",
}

/**
 * Coding tab of the public profile — coding-practice stats (solved / attempted /
 * points) plus the solved-problem history with the language(s) used. Self-contained
 * container: reads the username from the route, resolves it to the entity id, and
 * drives its own SWR (both reads are projection-backed server-side).
 *
 * @param props - optional className for the root element.
 */
export const ProfileCoding = ({
    className,
}: ProfileCodingProps) => {
    const t = useTranslations()
    const locale = useLocale()
    // route carries the username; resolve to the entity id the queries key off
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const {
        data,
        isLoading,
    } = useQueryUserCodingProgressSwr(userId)
    const { data: history } = useQueryUserCodingHistorySwr(userId)

    // first load in flight → skeleton matching the layout (stat grid + list)
    if (!data && (isLoading || !userId)) {
        return (
            <div className={cn("flex flex-col gap-6", className)}>
                <div className="grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((index) => (
                        <SectionCard key={index}>
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-20" />
                        </SectionCard>
                    ))}
                </div>
                <SectionCard>
                    <Skeleton className="h-4 w-32" />
                    <div className="flex flex-col gap-3">
                        {[0, 1, 2].map((row) => (
                            <Skeleton key={row} className="h-4 w-full" />
                        ))}
                    </div>
                </SectionCard>
            </div>
        )
    }

    // null data (no coding activity yet) → treat every metric as zero
    const stats = [
        {
            key: "solved",
            value: data?.solvedProblemIds.length ?? 0,
        },
        {
            key: "attempted",
            value: data?.attemptedProblemIds.length ?? 0,
        },
        {
            key: "points",
            value: data?.totalPoints ?? 0,
        },
    ]
    const solvedHistory = history ?? []

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {/* headline stat cards */}
            <div className="grid grid-cols-3 gap-3">
                {stats.map((stat) => (
                    <MetricCard
                        key={stat.key}
                        value={stat.value}
                        label={t(`publicProfile.coding.${stat.key}`)}
                    />
                ))}
            </div>

            {/* solved-problem history with the language(s) used */}
            {solvedHistory.length > 0 ? (
                <SectionCard title={t("publicProfile.coding.history")}>
                    <div className="flex flex-col gap-3">
                        {solvedHistory.map((item, index) => {
                            const level = DIFFICULTY_LEVEL[item.difficulty]
                            const subtitle = item.firstSolvedAt
                                ? new Date(item.firstSolvedAt).toLocaleDateString(locale)
                                : undefined
                            return (
                                <ListRow
                                    key={`${item.problemTitle}-${index}`}
                                    title={item.problemTitle}
                                    subtitle={subtitle}
                                    divider={index < solvedHistory.length - 1}
                                    meta={
                                        <div className="flex items-center gap-2">
                                            {level ? (
                                                <DifficultyChip difficulty={level} />
                                            ) : null}
                                            {item.languages.map((language) => (
                                                <StatusChip key={language} tone="neutral">
                                                    {language}
                                                </StatusChip>
                                            ))}
                                        </div>
                                    }
                                />
                            )
                        })}
                    </div>
                </SectionCard>
            ) : null}
        </div>
    )
}
