"use client"

import { EyeIcon } from "@phosphor-icons/react"
import React from "react"
import { Tooltip, cn } from "@heroui/react"
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
    /** Disables the reaction control (e.g. PREVIEW access or a mutation in flight). */
    disabled?: boolean
    /** When set, shows this text in a tooltip on the disabled reaction control. */
    disabledReason?: string
}

/**
 * Single-row content interaction: the shared {@link ReactionBar} (HeroUI Button trigger +
 * emoji picker + summary) on the left — IDENTICAL to each comment's reaction — and the
 * view count on the right. Save / share / fullscreen are intentionally NOT here — they own
 * a single home in the OnThisPage rail.
 *
 * When `disabled` is set the reaction control cannot be operated; pairing it with
 * `disabledReason` wraps the control in a tooltip (e.g. inviting a PREVIEW viewer to enroll).
 */
export const InteractionBar = ({
    summary,
    onReact,
    viewCount,
    disabled = false,
    disabledReason,
    className,
}: InteractionBarProps) => {
    const reactions = <ReactionBar summary={summary} onReact={onReact} disabled={disabled} />

    return (
        <div className={cn("flex items-center justify-between gap-3", className)}>
            {/* reaction trigger + summary — same control as the comment reactions */}
            {disabled && disabledReason ? (
                <Tooltip>
                    <Tooltip.Trigger>
                        {/* span keeps the tooltip target hoverable while the button is disabled */}
                        <span className="inline-flex">{reactions}</span>
                    </Tooltip.Trigger>
                    <Tooltip.Content>{disabledReason}</Tooltip.Content>
                </Tooltip>
            ) : (
                reactions
            )}

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
