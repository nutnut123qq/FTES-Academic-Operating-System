"use client"

import { EyeIcon } from "@phosphor-icons/react"
import React from "react"
import { cn } from "@heroui/react"
import { ReactionBar } from "./ReactionBar"
import { ReactionType, type ReactionSummary } from "@/modules/api/graphql/queries/types/discussion"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link InteractionBar}. */
export interface InteractionBarProps extends WithClassNames<undefined> {
    /** Aggregate reaction summary for the content. */
    summary: ReactionSummary | undefined
    /** React to / un-react from the content (null removes the reaction). */
    onReact: (type: ReactionType | null) => void
    /** Optional view count from the server (undefined = not tracked yet). */
    viewCount?: number
}

/**
 * Single-row content interaction: the shared {@link ReactionBar} (HeroUI Button trigger +
 * emoji picker + summary) on the left — IDENTICAL to each comment's reaction — and the
 * view count on the right. Save / share / fullscreen are intentionally NOT here — they own
 * a single home in the OnThisPage rail.
 */
export const InteractionBar = ({
    summary,
    onReact,
    viewCount,
    className,
}: InteractionBarProps) => {
    return (
        <div className={cn("flex items-center justify-between gap-3", className)}>
            {/* reaction trigger + summary — same control as the comment reactions */}
            <ReactionBar summary={summary} onReact={onReact} />

            {/* view count */}
            {viewCount !== undefined ? (
                <span className="flex items-center gap-2 text-xs text-muted">
                    <EyeIcon aria-hidden focusable="false" className="size-4" />
                    {viewCount.toLocaleString()}
                </span>
            ) : null}
        </div>
    )
}
