"use client"

import React from "react"
import {
    Button,
    cn,
    Typography,
} from "@heroui/react"
import {
    useProfileUsername,
} from "../useProfileUsername"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { useQueryUserCodingSkillsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCodingSkillsSwr"
import { useQueryUserProfileSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserProfileSwr"
import { useProfileTabStore } from "@/hooks/zustand/profileTab/store"
import { SectionCard } from "@/components/reuseable/SectionCard"
import { StatPair } from "@/components/blocks/stats/StatPair"
import { StatusChip } from "@/components/blocks/chips/StatusChip"

/** Props for {@link ProfileSkillsSnapshot}. */
export type ProfileSkillsSnapshotProps = WithClassNames<undefined>

/** Difficulty display config: label + StatusChip tone. */
const DIFF_CONFIG: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
    easy: { label: "Dễ", tone: "success" },
    medium: { label: "Trung bình", tone: "warning" },
    hard: { label: "Khó", tone: "danger" },
}

/** Capitalize the first character of a language key for display. */
const capitalizeKey = (key: string): string =>
    key.charAt(0).toUpperCase() + key.slice(1)

/**
 * Overview skills teaser — compact highlight showing the user's total solved
 * count, difficulty depth (easy/medium/hard chips), and top languages as chips
 * with their exact solve count (e.g. "Python · 3"). Drives its own SWR call
 * (SWR-deduped with the full Skills tab). Returns null when the user has
 * solved nothing so sparse profiles stay clean.
 *
 * Language chips show the REAL count, never a relative-to-max bar, to prevent
 * a user with 2 solves appearing to have "mastered" a language.
 *
 * @param props - optional className for the root element.
 */
export const ProfileSkillsSnapshot = ({
    className,
}: ProfileSkillsSnapshotProps) => {
    const username = useProfileUsername()
    const { data: user } = useQueryUserProfileSwr(username)
    const userId = user?.id ?? null
    const { data } = useQueryUserCodingSkillsSwr(userId)
    const setTab = useProfileTabStore((s) => s.setTab)

    const byLanguage = data?.byLanguage ?? []
    const byDifficulty = data?.byDifficulty ?? []

    const totalSolved = byDifficulty.reduce((acc, d) => acc + d.solved, 0)
        || byLanguage.reduce((acc, l) => acc + l.solved, 0)

    // nothing solved yet → hide entirely so sparse profiles stay clean
    if (totalSolved === 0) {
        return null
    }

    // top 4 languages by actual solve count, descending
    const topLanguages = [...byLanguage]
        .sort((a, b) => b.solved - a.solved)
        .slice(0, 4)

    const action = (
        <Button
            variant="ghost"
            size="sm"
            onPress={() => setTab("skills")}
            aria-label="Xem tất cả kỹ năng"
            className="text-accent"
        >
            Xem tất cả →
        </Button>
    )

    return (
        <SectionCard
            title="Kỹ năng"
            action={action}
            className={cn(className)}
        >
            {/* difficulty depth — total count + per-bucket chips */}
            <div className="flex flex-wrap items-center gap-3">
                <StatPair
                    value={totalSolved}
                    label="Bài đã giải"
                />
                <div className="flex flex-wrap gap-2">
                    {byDifficulty.map((d) => {
                        const cfg = DIFF_CONFIG[d.key]
                        return (
                            <StatusChip
                                key={d.key}
                                tone={cfg?.tone ?? "neutral"}
                            >
                                {cfg?.label ?? capitalizeKey(d.key)}&nbsp;·&nbsp;{d.solved}
                            </StatusChip>
                        )
                    })}
                </div>
            </div>

            {/* language breadth — chips with REAL counts, never relative-to-max bars */}
            {topLanguages.length > 0 ? (
                <div className="flex flex-col gap-2">
                    <Typography type="body-xs" color="muted">
                        Ngôn ngữ
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                        {topLanguages.map((lang) => (
                            <StatusChip
                                key={lang.key}
                                tone="neutral"
                            >
                                {capitalizeKey(lang.key)}&nbsp;·&nbsp;{lang.solved}
                            </StatusChip>
                        ))}
                    </div>
                </div>
            ) : null}
        </SectionCard>
    )
}
