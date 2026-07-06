"use client"

import React from "react"
import { cn } from "@heroui/react"
import { ProfileMenuCard } from "./ProfileMenuCard"
import { IdentityStats } from "./IdentityStats"
import { QuickActions } from "../QuickActions"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link DashboardIdentity}. */
export type DashboardIdentityProps = WithClassNames<undefined>

/**
 * Dashboard LEFT column — the viewer's own identity + standing, bare (no card),
 * mirroring StarCI's identity sidebar. Stacks: the profile anchor (avatar + name +
 * link), a compact standing row (streak · AI credit · reward), then the quick-action
 * shortcuts. Each child self-fetches its own mock leaf query.
 * @param props - optional className for the root column.
 */
export const DashboardIdentity = ({ className }: DashboardIdentityProps) => {
    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {/* profile anchor — avatar + name, links to the profile */}
            <ProfileMenuCard />
            {/* glanceable standing */}
            <IdentityStats />
            {/* one-tap shortcuts to the most-reached surfaces */}
            <QuickActions />
        </div>
    )
}
