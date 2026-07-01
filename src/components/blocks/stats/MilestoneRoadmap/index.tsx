import React from "react"
import { cn } from "@heroui/react"

import type { WithClassNames } from "@/modules/types/base/class-name"

/** One milestone node on the roadmap. */
export interface MilestoneRoadmapItem {
    /** Milestone title (used for the hover tooltip). */
    title: string
    /** Number of tasks passed in this milestone. */
    passedTasks: number
    /** Total tasks in this milestone. */
    totalTasks: number
}

/** Props for the {@link MilestoneRoadmap} block. */
export interface MilestoneRoadmapProps extends WithClassNames<undefined> {
    /** Ordered milestones rendered left → right as dots + connectors. */
    milestones: ReadonlyArray<MilestoneRoadmapItem>
}

/**
 * Horizontal milestone roadmap: one dot per milestone joined by connectors,
 * coloured by completion (done = filled success, partial = ringed success,
 * not-started = muted). Scrolls horizontally so a long roadmap never crams.
 * Pure + props-only; the block owns all the dot/connector styling so feature
 * code stays style-free.
 */
export const MilestoneRoadmap = ({ milestones, className }: MilestoneRoadmapProps) => {
    return (
        <div className={cn("flex items-center gap-0 overflow-x-auto pb-1", className)}>
            {milestones.map((milestone, index) => {
                const isDone = milestone.totalTasks > 0
                    && milestone.passedTasks === milestone.totalTasks
                const isPartial = milestone.passedTasks > 0
                    && milestone.passedTasks < milestone.totalTasks
                return (
                    <React.Fragment key={`${milestone.title}-${index}`}>
                        {index > 0 ? (
                            <span aria-hidden className="h-0.5 min-w-3 flex-1 bg-default/60" />
                        ) : null}
                        <span
                            title={`${milestone.title} ${milestone.passedTasks}/${milestone.totalTasks}`}
                            aria-hidden
                            className={cn(
                                "size-3 shrink-0 rounded-full",
                                isDone && "bg-success",
                                isPartial && "border-2 border-success",
                                !isDone && !isPartial && "bg-default",
                            )}
                        />
                    </React.Fragment>
                )
            })}
        </div>
    )
}
