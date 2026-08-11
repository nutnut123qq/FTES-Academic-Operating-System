"use client"

import React from "react"
import { cn } from "@heroui/react"
import { TopLearners } from "./TopLearners"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CommunityTab}. */
export type CommunityTabProps = WithClassNames<undefined>

/**
 * Dashboard COMMUNITY panel — competition and standing among people. Holds the ranked
 * {@link TopLearners} card, which self-fetches its own leaf query and owns its four
 * states through `AsyncContent`.
 *
 * StarCI's companion "League tuần" card is deliberately NOT ported: FTES has no league /
 * weekly-cohort backend (the only ranked source is the season-scoped global leaderboard),
 * so a league card here could only show invented cohorts.
 *
 * @param props - optional root class name (placement only)
 */
export const CommunityTab = ({ className }: CommunityTabProps) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <TopLearners />
        </div>
    )
}
