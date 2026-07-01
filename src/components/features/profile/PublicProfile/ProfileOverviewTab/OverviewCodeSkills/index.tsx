"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useProfileUsername } from "../../hooks/useProfileUsername"
import { useQueryUserCodingSkillsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCodingSkillsSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { SegmentBar } from "@/components/blocks/stats/SegmentBar"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { StatPair } from "@/components/blocks/stats/StatPair"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"
import { getLanguageColor, getLanguageLabel } from "@/modules/utils/language"

/** Props for {@link OverviewCodeSkills}. */
export type OverviewCodeSkillsProps = WithClassNames<undefined>

/** Capitalize the first character of a key for display. */
const capitalizeKey = (key: string): string =>
    key.charAt(0).toUpperCase() + key.slice(1)

/** Slice colour per difficulty bucket (semantic). */
const DIFF_COLOR: Record<string, string> = {
    easy: "var(--success)",
    medium: "var(--warning)",
    hard: "var(--danger)",
}

/**
 * Overview content — skills proven by solving CODE PROBLEMS (the practice judge):
 * total solved + difficulty depth chips + top-language chips with real counts.
 * Content only (no card): the parent {@link import("@/components/blocks").LabeledCard}
 * supplies the frame; the fetch goes through {@link AsyncContent}. Counts are real,
 * never relative-to-max, so 2 solves never looks like mastery.
 *
 * @param props - optional root class name (placement only)
 */
export const OverviewCodeSkills = ({ className }: OverviewCodeSkillsProps) => {
    const t = useTranslations()
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const { data, isLoading, error, mutate } = useQueryUserCodingSkillsSwr(userId)

    const byLanguage = data?.byLanguage ?? []
    const byDifficulty = data?.byDifficulty ?? []
    const totalSolved = byDifficulty.reduce((acc, d) => acc + d.solved, 0)
        || byLanguage.reduce((acc, l) => acc + l.solved, 0)
    const orderedLanguages = [...byLanguage].sort((a, b) => b.solved - a.solved)

    /** Localized label for a difficulty bucket; falls back to the capitalized key. */
    const diffLabel = (key: string): string => {
        const labels: Record<string, string> = {
            easy: t("publicProfile.skillsSnapshot.diffEasy"),
            medium: t("publicProfile.skillsSnapshot.diffMedium"),
            hard: t("publicProfile.skillsSnapshot.diffHard"),
        }
        return labels[key] ?? capitalizeKey(key)
    }

    return (
        <AsyncContent
            isLoading={(isLoading || !userId) && totalSolved === 0 && !data}
            skeleton={(
                <SurfaceListCard>
                    <SurfaceListCardItem>
                        <div className="flex flex-col gap-3">
                            {/* StatPair (total solved + label) + difficulty bar + language */}
                            <Skeleton.Metric />
                            <Skeleton.SegmentBar legendItems={2} />
                            <div className="flex flex-col gap-2">
                                <Skeleton.Typography type="body-xs" width="1/4" />
                                <Skeleton.SegmentBar legendItems={4} />
                            </div>
                        </div>
                    </SurfaceListCardItem>
                </SurfaceListCard>
            )}
            isEmpty={totalSolved === 0}
            emptyContent={{
                title: t("publicProfile.skills.empty"),
                description: t("publicProfile.skills.emptyHint"),
            }}
            error={!data ? error : undefined}
            errorContent={{
                title: t("publicProfile.loadError"),
                onRetry: () => { void mutate() },
                retryLabel: t("publicProfile.loadErrorRetry"),
            }}
        >
            <SurfaceListCard className={cn("h-full", className)}>
                <SurfaceListCardItem>
                    <div className="flex flex-col gap-3">
                        {/* total solved headline + difficulty depth (easy→hard, real shares) */}
                        <StatPair
                            value={totalSolved}
                            label={t("publicProfile.skillsSnapshot.solvedLabel")}
                        />
                        <SegmentBar
                            ariaLabel={`${totalSolved} ${t("publicProfile.skillsSnapshot.solvedLabel")}`}
                            segments={byDifficulty.map((d) => ({
                                key: d.key,
                                label: diffLabel(d.key),
                                value: d.solved,
                                color: DIFF_COLOR[d.key],
                            }))}
                        />
                        {/* language breadth — same SegmentBar + brand legend as the Skills tab */}
                        {orderedLanguages.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                <Typography type="body-xs" color="muted">
                                    {t("publicProfile.skillsSnapshot.languagesLabel")}
                                </Typography>
                                <SegmentBar
                                    ariaLabel={t("publicProfile.skillsSnapshot.languagesLabel")}
                                    segments={orderedLanguages.map((lang) => ({
                                        key: lang.key,
                                        label: getLanguageLabel(lang.key),
                                        value: lang.solved,
                                        color: getLanguageColor(lang.key),
                                    }))}
                                />
                            </div>
                        ) : null}
                    </div>
                </SurfaceListCardItem>
            </SurfaceListCard>
        </AsyncContent>
    )
}
