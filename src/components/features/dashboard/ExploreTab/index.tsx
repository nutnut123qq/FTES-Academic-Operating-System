"use client"

import React from "react"
import { cn } from "@heroui/react"
import { ExploreTrending } from "./ExploreTrending"
import { ExploreFeed } from "./ExploreFeed"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ExploreTab}. */
export type ExploreTabProps = WithClassNames<undefined>

/**
 * Dashboard EXPLORE panel — discovery first, then the stream: the platform's
 * currently trending community posts as a compact ranked list, followed by the
 * shared community feed scoped to "Khám phá / Đang theo dõi".
 *
 * Every widget self-fetches its own leaf query and owns its four states through
 * `AsyncContent`; nothing is fetched here. "Who to follow" is deliberately absent —
 * the backend exposes no follow-suggestion endpoint, so the card could only have
 * shown invented people.
 *
 * @param props - optional root class name (placement only)
 */
export const ExploreTab = ({ className }: ExploreTabProps) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <ExploreTrending />
            <ExploreFeed />
        </div>
    )
}
