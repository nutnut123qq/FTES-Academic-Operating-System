"use client"

import React, {
    useState,
} from "react"
import {
    Button,
    Card,
    CardContent,
    ProgressBar,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    Rocket as RocketIcon,
} from "@gravity-ui/icons"
import {
    CheckCircleIcon,
} from "@phosphor-icons/react"
import {
    EntityToken,
} from "@/components/features/dashboard/EntityToken"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import type { QueryUserCapstoneCourseProgress } from "@/modules/api/graphql/queries/types/user-capstone-progress"

/** Props for {@link ProjectCard}. */
export interface ProjectCardProps extends WithClassNames<undefined> {
    /** The single course capstone progress to showcase. */
    project: QueryUserCapstoneCourseProgress
}

/**
 * One personal-project "showcase" card for a course: a project header (rocket +
 * course token), an overall task ProgressBar with a milestone/task summary line, a
 * horizontal milestone roadmap (one dot per milestone, coloured by completion),
 * and a collapsible accordion listing every milestone and its tasks. The expand
 * state is purely presentational, so a local useState is appropriate here.
 *
 * @param props - {@link ProjectCardProps}
 */
export const ProjectCard = ({
    project,
    className,
}: ProjectCardProps) => {
    const t = useTranslations()
    const locale = useLocale()

    /** Whether the milestone/task detail accordion is open. */
    const [expanded, setExpanded] = useState(false)

    // milestones ordered along the roadmap (defensive copy before sort)
    const milestones = [
        ...project.milestones,
    ].sort((a, b) => a.position - b.position)

    return (
        <Card className={className}>
            <CardContent className="flex flex-col gap-3">
                {/* project header: rocket + course token */}
                <div className="flex min-w-0 items-center gap-1.5">
                    <RocketIcon className="size-5 shrink-0 text-accent" />
                    <EntityToken
                        globalId={project.courseGlobalId}
                        label={project.courseTitle}
                    />
                </div>

                {/* overall task progress + roll-up summary */}
                <div className="flex flex-col gap-1.5">
                    <ProgressBar
                        aria-label={project.courseTitle}
                        value={project.completedTasks}
                        maxValue={Math.max(project.totalTasks, 1)}
                        color="accent"
                        size="sm"
                    >
                        <ProgressBar.Track>
                            <ProgressBar.Fill />
                        </ProgressBar.Track>
                    </ProgressBar>
                    <span className="text-xs text-muted">
                        {t("publicProfile.capstone.roadmapSummary", {
                            completedMilestones: project.completedMilestones,
                            totalMilestones: project.totalMilestones,
                            completedTasks: project.completedTasks,
                            totalTasks: project.totalTasks,
                        })}
                    </span>
                </div>

                {/* milestone roadmap: one dot per milestone, connectors between.
                    scrolls horizontally so a 20-milestone project never crams. */}
                {milestones.length > 0 ? (
                    <div className="flex items-center gap-0 overflow-x-auto pb-1">
                        {milestones.map((milestone, index) => {
                            const isDone = milestone.totalTasks > 0
                                && milestone.passedTasks === milestone.totalTasks
                            const isPartial = milestone.passedTasks > 0
                                && milestone.passedTasks < milestone.totalTasks
                            return (
                                <React.Fragment key={milestone.title + "-" + index}>
                                    {index > 0 ? (
                                        <span className="h-0.5 min-w-3 flex-1 bg-default/40" />
                                    ) : null}
                                    <span
                                        title={milestone.title + " " + milestone.passedTasks + "/" + milestone.totalTasks}
                                        className={cn(
                                            "size-3 shrink-0 rounded-full",
                                            isDone && "bg-success",
                                            isPartial && "border-2 border-success bg-transparent",
                                            !isDone && !isPartial && "bg-default/60",
                                        )}
                                    />
                                </React.Fragment>
                            )
                        })}
                    </div>
                ) : null}

                {/* accordion toggle: presentational disclosure, not a modal */}
                {milestones.length > 0 ? (
                    <Button
                        variant="tertiary"
                        size="sm"
                        onPress={() => setExpanded((open) => !open)}
                    >
                        {expanded
                            ? t("publicProfile.capstone.hideTasks")
                            : t("publicProfile.capstone.viewTasks")}
                    </Button>
                ) : null}

                {/* expanded detail: milestones with their tasks */}
                {expanded ? (
                    <div className="flex flex-col gap-3">
                        {milestones.map((milestone, milestoneIndex) => (
                            <div
                                key={milestone.title + "-detail-" + milestoneIndex}
                                className="flex flex-col gap-1.5"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="truncate text-sm font-medium text-foreground">
                                        {milestone.title}
                                    </span>
                                    <span className="shrink-0 text-xs text-muted">
                                        {milestone.passedTasks}/{milestone.totalTasks}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {milestone.tasks.map((task, taskIndex) => (
                                        <div
                                            key={task.title + "-" + taskIndex}
                                            className={cn(
                                                "flex items-center justify-between gap-3 rounded-medium border border-default/40 p-3",
                                                !task.passed && "opacity-60",
                                            )}
                                        >
                                            <div className="flex min-w-0 items-center gap-1.5">
                                                {task.passed ? (
                                                    <CheckCircleIcon className="size-5 shrink-0 text-success" />
                                                ) : null}
                                                <span className="truncate text-sm text-foreground">
                                                    {task.title}
                                                </span>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-3 text-xs text-muted">
                                                {task.passed ? (
                                                    <span className="font-medium text-foreground">
                                                        {t("publicProfile.capstone.score", { score: task.score })}
                                                    </span>
                                                ) : null}
                                                {task.passed && task.passedAt ? (
                                                    <span>
                                                        {new Date(task.passedAt).toLocaleDateString(locale)}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    )
}
