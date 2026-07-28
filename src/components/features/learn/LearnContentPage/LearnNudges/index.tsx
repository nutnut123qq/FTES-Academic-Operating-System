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
} from "../../hooks/useQueryLearnLeaderboardSwr"

/** Props for {@link LearnNudges}. */
export type LearnNudgesProps = WithClassNames<undefined>

/**
 * Contextual "next actions" strip on the content home — surfaces the built-but-
 * undiscoverable leaderboard as a timely nudge. The BE `myRank` snapshot carries the
 * viewer's 1-based rank over the WHOLE course population, so we fall back to it when
 * the viewer sits outside the returned top window (otherwise the nudge would vanish
 * for anyone ranked past the window). Each nudge self-hides when it has nothing to
 * say; the whole strip renders nothing when none apply. Container: reads its own SWR.
 * Built on `SurfaceListCard`.
 *
 * @param props - {@link LearnNudgesProps}
 */
export const LearnNudges = ({ className }: LearnNudgesProps) => {
    const t = useTranslations("learn")
    const router = useRouter()
    const { courseId } = useParams<{ courseId: string }>()
    const { entries, myRank, viewerUserId } = useQueryLearnLeaderboardSwr(courseId)

    // Prefer the viewer's standing within the returned window (client re-rank of the
    // "total" board == server rank while in-window); fall back to the server myRank.rank
    // computed over the whole population when the viewer is outside the window.
    const windowRank = viewerUserId
        ? rankEntriesByCategory(entries, "total").find(
            (row) => row.entry.userId === viewerUserId,
        )?.displayRank ?? null
        : null
    const rank = windowRank ?? myRank?.rank ?? null

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
