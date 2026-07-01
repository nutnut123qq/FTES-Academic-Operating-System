import React from "react"
import { Typography, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One topic cell in a {@link TopicMasteryGrid}. */
export interface TopicMasterySegment {
    /** Stable key. */
    key: string
    /** Display label (e.g. "Dynamic Programming"). */
    label: string
    /** Solved count — drives both the printed number and the tint intensity. */
    solved: number
}

/** Props for the {@link TopicMasteryGrid} block. */
export interface TopicMasteryGridProps extends WithClassNames<undefined> {
    /** Topics to show, already sorted (strongest first reads best). */
    topics: Array<TopicMasterySegment>
    /** Accessible summary of the whole grid (read instead of the cells). */
    ariaLabel: string
}

/**
 * Topic-mastery grid — a LeetCode-style "what CS areas is this dev strong in"
 * heatmap. Each solved topic is a NEUTRAL chip whose tint deepens with the solved
 * count (relative to the strongest topic), with the count printed so the signal
 * never relies on colour alone. Neutral (not accent) so it doesn't compete with
 * the app's accent — the printed count carries the magnitude. Honest (no hidden
 * topics, real counts) and compact. Pure/props-only; owns its look.
 *
 * @param props - {@link TopicMasteryGridProps}
 */
export const TopicMasteryGrid = ({ topics, ariaLabel, className }: TopicMasteryGridProps) => {
    const max = topics.reduce((peak, topic) => Math.max(peak, topic.solved), 0) || 1
    return (
        <div
            role="img"
            aria-label={ariaLabel}
            className={cn("flex flex-wrap gap-2", className)}
        >
            {topics.map((topic) => {
                // deeper neutral tint the closer a topic is to the strongest (12%–48%)
                const intensity = Math.round(12 + (topic.solved / max) * 36)
                return (
                    <span
                        key={topic.key}
                        style={{ backgroundColor: `color-mix(in srgb, var(--default) ${intensity}%, transparent)` }}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1"
                    >
                        <Typography type="body-xs" weight="medium">
                            {topic.label}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {topic.solved}
                        </Typography>
                    </span>
                )
            })}
        </div>
    )
}
