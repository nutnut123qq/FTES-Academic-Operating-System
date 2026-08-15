"use client"

import React from "react"
import { cn } from "@heroui/react"
import { MembershipSection } from "./MembershipSection"
import { AiPlanSection } from "./AiPlanSection"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PlanTab}. */
export type PlanTabProps = WithClassNames<undefined>

/**
 * Dashboard "MY PLAN" panel (`/dashboard?tab=plan`) — everything the viewer can be
 * subscribed to, in one scrolling column: {@link MembershipSection} (the community
 * membership) then {@link AiPlanSection} (the FrosTES AI credit tiers). Both screens
 * moved here VERBATIM from `/profile/settings/{membership,ai-subscription}`, which no
 * longer exist: buying a plan is not a preference, and the settings rail was the wrong
 * place to keep the two money screens.
 *
 * Two stacked sections, deliberately NOT sub-tabs — the panel already sits under the
 * dashboard's own tab strip. Each section owns its own reads, states and confirm-modal;
 * nothing is fetched here.
 *
 * @param props - optional root class name (placement only)
 */
export const PlanTab = ({ className }: PlanTabProps) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <MembershipSection />
            <AiPlanSection />
        </div>
    )
}
