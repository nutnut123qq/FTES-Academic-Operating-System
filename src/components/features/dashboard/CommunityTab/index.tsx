"use client"

import React from "react"
import { cn } from "@heroui/react"
import { MyPosts } from "./MyPosts"
import { SavedSection } from "./SavedSection"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CommunityTab}. */
export type CommunityTabProps = WithClassNames<undefined>

/**
 * Dashboard "MY RESOURCE" panel (`/dashboard?tab=community`) — what the viewer OWNS on
 * the platform, in one scrolling column: {@link MyPosts} (every community post they
 * published) then {@link SavedSection} (everything they bookmarked — tài liệu, khoá học,
 * bài viết). Both widgets self-fetch their own leaf query and own their four states
 * through `AsyncContent`; nothing is fetched here. Two stacked sections, deliberately NOT
 * sub-tabs: the panel already sits under the dashboard's own tab strip, and a second tab
 * level would hide half the content behind another click.
 *
 * NAMING: the component + folder are still called `CommunityTab` for historical reasons —
 * the dashboard shell imports `CommunityTab` from `./CommunityTab` and mirrors the panel
 * to `?tab=community`, and renaming would have to move through that shell. The CONTENT is
 * "My Resource"; treat the `community` name as the URL/route key only.
 *
 * The previous content — the `TopLearners` leaderboard card — was REPLACED, not moved:
 * competition/standing is not "my stuff", and the full board already has its own page at
 * `/leaderboard`. `TopLearners` + its skeleton are now unreferenced; deleting them (and
 * the `dashboard.community.topLearners.*` strings) is a separate call — see the notes.
 *
 * @param props - optional root class name (placement only)
 */
export const CommunityTab = ({ className }: CommunityTabProps) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <MyPosts />
            <SavedSection />
        </div>
    )
}
