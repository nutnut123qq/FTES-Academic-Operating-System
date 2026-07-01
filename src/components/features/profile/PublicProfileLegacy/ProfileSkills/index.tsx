"use client"

import React from "react"
import {
    cn,
    Skeleton,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    useProfileUsername,
} from "../useProfileUsername"
import {
    LanguageDonut,
} from "./LanguageDonut"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryUserCodingSkillsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCodingSkillsSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import type { QueryUserCodingSkillCount } from "@/modules/api/graphql/queries/types/user-coding-skills"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { DifficultyChip, type Difficulty } from "@/components/blocks/chips/DifficultyChip"
import { EmptyState } from "@/components/blocks/feedback/EmptyState"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"

/** Props for {@link ProfileSkills}. */
export type ProfileSkillsProps = WithClassNames<undefined>

/** Canonical easy → hard ordering for the depth-by-difficulty bars. */
const DIFFICULTY_ORDER = ["easy", "medium", "hard", "insane"] as const

/** Map a raw difficulty key onto a {@link DifficultyChip} level. */
const DIFFICULTY_LEVEL: Record<string, Difficulty> = {
    easy: "beginner",
    medium: "intermediate",
    hard: "advanced",
    insane: "insane",
}

/** Title-case a bucket key for display when it has no dedicated chip level. */
const labelOf = (key: string): string => key.charAt(0).toUpperCase() + key.slice(1)

/**
 * Skills tab — the profile owner's solved-coding breakdown. Leads with
 * depth-by-difficulty bars (each difficulty's share of total solved problems, an
 * honest signal of how deep the dev goes — NEVER scaled relative to the biggest
 * bucket, which would mislead) and a language-mix donut. Self-contained
 * container: reads the username from the route, resolves it to the entity id,
 * drives its own SWR.
 *
 * @param props - optional className for the root element.
 */
export const ProfileSkills = ({
    className,
}: ProfileSkillsProps) => {
    const t = useTranslations()
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const {
        data,
        isLoading,
    } = useQueryUserCodingSkillsSwr(userId)

    // first load in flight → skeleton matching the layout (two stacked cards)
    if (!data && (isLoading || !userId)) {
        return (
            <div className={cn("flex flex-col gap-6", className)}>
                {[0, 1].map((index) => (
                    <SectionCard key={index}>
                        <Skeleton className="h-4 w-32" />
                        <div className="flex flex-col gap-3">
                            {[0, 1, 2].map((row) => (
                                <Skeleton key={row} className="h-4 w-full" />
                            ))}
                        </div>
                    </SectionCard>
                ))}
            </div>
        )
    }

    const byLanguage = data?.byLanguage ?? []
    const byDifficulty = data?.byDifficulty ?? []
    // no solved problems in either grouping → action-oriented empty state
    if (byLanguage.length === 0 && byDifficulty.length === 0) {
        return (
            <SectionCard className={className}>
                <EmptyState
                    title={t("publicProfile.skills.empty")}
                    description={t("publicProfile.skills.emptyHint")}
                />
            </SectionCard>
        )
    }

    // total solved across difficulties → honest denominator for the depth bars
    const difficultyTotal = byDifficulty.reduce((sum, item) => sum + item.solved, 0)
    const orderedDifficulty = [...byDifficulty].sort(
        (a, b) => DIFFICULTY_ORDER.indexOf(a.key as (typeof DIFFICULTY_ORDER)[number])
            - DIFFICULTY_ORDER.indexOf(b.key as (typeof DIFFICULTY_ORDER)[number]),
    )

    /** Render one depth bar — share of total solved, not relative to the max. */
    const renderDifficultyBar = (item: QueryUserCodingSkillCount) => {
        const level = DIFFICULTY_LEVEL[item.key]
        return (
            <div
                key={item.key}
                className="flex flex-col gap-2"
            >
                <div className="flex items-center justify-between gap-2">
                    {level ? (
                        <DifficultyChip difficulty={level} />
                    ) : (
                        <Typography type="body-xs" color="muted">{labelOf(item.key)}</Typography>
                    )}
                    <Typography type="body-xs" color="muted">{item.solved}</Typography>
                </div>
                <ProgressMeter value={item.solved} max={difficultyTotal} />
            </div>
        )
    }

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {byDifficulty.length > 0 ? (
                <SectionCard title={t("publicProfile.skills.byDifficulty")}>
                    <div className="flex flex-col gap-3">
                        {orderedDifficulty.map(renderDifficultyBar)}
                    </div>
                </SectionCard>
            ) : null}
            {byLanguage.length > 0 ? (
                <SectionCard title={t("publicProfile.skills.byLanguage")}>
                    <LanguageDonut items={byLanguage} />
                </SectionCard>
            ) : null}
        </div>
    )
}
