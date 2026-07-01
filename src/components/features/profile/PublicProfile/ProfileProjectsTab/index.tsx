"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    ProfilePinned,
} from "./ProfilePinned"
import {
    ProfileCapstone,
} from "./ProfileCapstone"

/** Props for {@link ProfileProjectsTab}. */
export type ProfileProjectsTabProps = WithClassNames<undefined>

/**
 * "Projects" tab of the public profile (NEW-PROFILE.spec.md §7.2). The portfolio
 * view: a recruiter's verifiable-work column, top to bottom in credibility order.
 *
 * 1. {@link ProfilePinned} — the hand-picked showcase (verified course capstones +
 *    external projects), GitHub-pinned-repos style; owner gets add/manage.
 * 2. {@link ProfileCapstone} — per-course capstone work with milestone/task roadmap
 *    progress and "Verified by StarCi" signals.
 *
 * Solved challenges are intentionally NOT shown here — they already surface in the
 * Overview tab's "skills from challenges" card, so repeating them would be noise.
 *
 * A thin composition: each section is its own self-fetching container (deduped via
 * SWR on the viewed user), so this tab takes no data props and each section hides
 * itself when empty for a visitor — sparse profiles stay clean, and the owner sees
 * guidance to enroll / start. Single centered column, vertical rhythm `gap-6`.
 *
 * @param props - {@link ProfileProjectsTabProps}
 */
export const ProfileProjectsTab = ({
    className,
}: ProfileProjectsTabProps) => {
    return (
        <div className={cn("flex min-w-0 flex-col gap-6", className)}>
            <ProfilePinned />
            <ProfileCapstone />
        </div>
    )
}
