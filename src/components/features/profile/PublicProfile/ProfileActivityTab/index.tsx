"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    ProfileAchievements,
} from "./ProfileAchievements"
import {
    ProfileActivity,
} from "./ProfileActivity"

/** Props for {@link ProfileActivityTab}. */
export type ProfileActivityTabProps = WithClassNames<undefined>

/**
 * "Activity" tab of the public profile (NEW-PROFILE.spec.md §7.4). A single
 * centered column with two editorial sections — earned achievements (badge wall
 * by tier/rank) then the activity timeline. Courses live in the Overview tab, so
 * they are not repeated here. A thin composition: each section is its own
 * self-fetching `LabeledCard` that self-hides when empty, so this wrapper only
 * stacks them with the `gap-6` vertical rhythm.
 *
 * @param props - {@link ProfileActivityTabProps}
 */
export const ProfileActivityTab = ({
    className,
}: ProfileActivityTabProps) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <ProfileAchievements />
            <ProfileActivity />
        </div>
    )
}
