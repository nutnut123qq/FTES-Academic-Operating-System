"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    LeagueCard,
} from "../LeagueCard"
import {
    GlobalStanding,
} from "../GlobalStanding"
import {
    TopLearners,
} from "../TopLearners"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/**
 * Dashboard "Community" tab — competition + standing among people: the weekly
 * league cohort, the viewer's global standing, and the platform's top learners
 * (follow inline). Each child self-fetches + self-hides when empty. The product
 * changelog ("Có gì mới") now lives on the Overview tab, not here — Community is
 * people/competition, not platform news.
 * @param props - optional root class name (placement only)
 */
export type CommunityTabProps = WithClassNames<undefined>

export const CommunityTab = ({
    className,
}: CommunityTabProps) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <LeagueCard framed />
            <GlobalStanding />
            <TopLearners />
        </div>
    )
}
