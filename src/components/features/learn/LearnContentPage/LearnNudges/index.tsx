"use client"

import React from "react"
import { ArrowRightIcon, TrophyIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { SurfaceListCard, SurfaceListCardRow } from "@/components/blocks/cards/SurfaceListCard"
import type { WithClassNames } from "@/modules/types/base/class-name"
import {
    rankEntriesByCategory,
    useQueryLearnLeaderboardSwr,
    VIEWER_USER_ID,
} from "../../hooks/useQueryLearnLeaderboardSwr"

/** Props for {@link LearnNudges}. */
export type LearnNudgesProps = WithClassNames<undefined>

/**
 * Contextual "next actions" strip on the content home — surfaces the built-but-
 * undiscoverable leaderboard as a timely nudge. FTES's `myRank` snapshot carries no
 * server rank, so the viewer's 1-based rank is computed client-side from the ranked
 * entries. Each nudge self-hides when it has nothing to say; the whole strip renders
 * nothing when none apply. Container: reads its own SWR. Built on `SurfaceListCard`.
 *
 * @param props - {@link LearnNudgesProps}
 */
export const LearnNudges = ({ className }: LearnNudgesProps) => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { entries } = useQueryLearnLeaderboardSwr(courseId)

    // FTES myRank has no server rank → derive the viewer's 1-based rank from the board
    const rank = rankEntriesByCategory(entries, "total").find(
        (row) => row.entry.userId === VIEWER_USER_ID,
    )?.displayRank ?? null

    if (rank === null) {
        return null
    }

    return (
        <SurfaceListCard className={className}>
            <SurfaceListCardRow
                hover="underline"
                leading={<TrophyIcon aria-hidden focusable="false" className="size-5 text-accent" />}
                title={t("nudges.rank", { rank })}
                trailing={<ArrowRightIcon aria-hidden focusable="false" className="size-5 text-muted" />}
                onPress={() => router.push(`/courses/${courseId}/learn/leaderboard`)}
            />
        </SurfaceListCard>
    )
}

export default LearnNudges
