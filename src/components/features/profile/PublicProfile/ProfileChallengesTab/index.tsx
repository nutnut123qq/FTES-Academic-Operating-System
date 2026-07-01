"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    ProfileChallenges,
} from "./ProfileChallenges"

/** Props for {@link ProfileChallengesTab}. */
export type ProfileChallengesTabProps = WithClassNames<undefined>

/**
 * "Challenges" tab of the public profile (SKILLS-TABS-UX-BRAINSTORM.md §4) — the
 * proof-first, recruiter-facing view of graded-challenge work: a passed count, a
 * language-breadth bar, and the submission list (each row links out to the
 * submitted repo). The single section self-fetches the viewed user, so the tab
 * takes no data props; single centered column, vertical rhythm `gap-6`.
 *
 * @param props - {@link ProfileChallengesTabProps}
 */
export const ProfileChallengesTab = ({
    className,
}: ProfileChallengesTabProps) => {
    return (
        <div className={cn("flex min-w-0 flex-col gap-6", className)}>
            <ProfileChallenges />
        </div>
    )
}
