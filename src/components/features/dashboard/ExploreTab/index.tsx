"use client"

import React from "react"
import { cn } from "@heroui/react"
import { ExploreMarketplace } from "./ExploreMarketplace"
import { ExploreTrending } from "./ExploreTrending"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ExploreTab}. */
export type ExploreTabProps = WithClassNames<undefined>

/**
 * Dashboard EXPLORE panel — the shop first, then what the community is reading: a
 * short teaser of the marketplace, followed by the platform's currently trending
 * community posts as a compact ranked list.
 *
 * The community FEED (composer + post stream) used to live here and was removed on
 * 2026-08-13 at the reviewer's request: the dashboard is a cockpit, and the feed has
 * its own home at `/community`. Consequence to know before "restoring" it — there is
 * no longer any way to compose a post from the dashboard, which was accepted
 * deliberately, not overlooked. `ExploreFeed` still exists and is unused.
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
            <ExploreMarketplace />
            <ExploreTrending />
        </div>
    )
}
