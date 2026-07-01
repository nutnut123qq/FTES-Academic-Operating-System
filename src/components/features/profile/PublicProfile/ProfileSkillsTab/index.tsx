"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    ProfileCoding,
} from "./ProfileCoding"

/** Props for {@link ProfileSkillsTab}. */
export type ProfileSkillsTabProps = WithClassNames<undefined>

/**
 * Skills tab ("Kỹ năng & Lập trình") of the public profile — a sibling of the
 * Challenges tab. Delegates the whole tab to {@link ProfileCoding}, which leads
 * with the headline metric row, gathers the breakdowns into one "Stats" card, and
 * lists the solve history. Self-contained: it reads the username from the route,
 * drives its own SWR, and self-hides each block when there is nothing to show.
 *
 * @param props - optional className for the root element.
 */
export const ProfileSkillsTab = ({
    className,
}: ProfileSkillsTabProps) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {/* metric row → gathered stats card → solve history */}
            <ProfileCoding />
        </div>
    )
}
