import React from "react"
import { BookOpenIcon, ClockIcon, LightningIcon, TargetIcon } from "@phosphor-icons/react"
import type { ReactNode } from "react"

/**
 * Phosphor icon per backend goal metric (`XP` | `LESSONS` | `MINUTES`). Unknown
 * metrics fall back to a generic target icon so an admin-added metric still renders.
 */
export const GOAL_METRIC_ICON_MAP: Record<string, ReactNode> = {
    XP: <LightningIcon aria-hidden focusable="false" className="size-5 shrink-0" />,
    LESSONS: <BookOpenIcon aria-hidden focusable="false" className="size-5 shrink-0" />,
    MINUTES: <ClockIcon aria-hidden focusable="false" className="size-5 shrink-0" />,
}

/** Generic goal icon for metrics with no specific mapping. */
export const GOAL_METRIC_FALLBACK_ICON: ReactNode = (
    <TargetIcon aria-hidden focusable="false" className="size-5 shrink-0" />
)

/**
 * Icon for a weekly-goal row, keyed by metric.
 *
 * @param metric - the backend metric key
 * @returns the phosphor icon node for that metric
 */
export const goalMetricIcon = (metric: string): ReactNode =>
    GOAL_METRIC_ICON_MAP[metric] ?? GOAL_METRIC_FALLBACK_ICON
