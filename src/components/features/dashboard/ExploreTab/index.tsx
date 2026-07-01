"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    FeedTabs,
} from "../FeedTabs"
import {
    WhoToFollow,
} from "../WhoToFollow"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"

/** Props for {@link ExploreTab}. */
export type ExploreTabProps = WithClassNames<undefined>

/**
 * Dashboard "Explore" tab — discovery + social: the for-you / following activity
 * feed (with trending) on top, then "who to follow" to grow the graph. Each child
 * self-fetches; the feed owns its own pagination + states.
 * @param props - optional root class name (placement only)
 */
export const ExploreTab = ({
    className,
}: ExploreTabProps) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <FeedTabs />
            <WhoToFollow />
        </div>
    )
}
