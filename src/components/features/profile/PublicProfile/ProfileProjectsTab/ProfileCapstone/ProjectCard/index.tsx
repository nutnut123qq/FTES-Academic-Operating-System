"use client"

import React, {
    useState,
} from "react"
import {
    Link,
    Typography,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    CaretDownIcon,
    CheckCircleIcon,
    RocketIcon,
    SealCheckIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { ProgressMeter } from "@/components/blocks/stats/ProgressMeter"
import { SegmentBar } from "@/components/blocks/stats/SegmentBar"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import type { QueryUserCapstoneCourseProgress } from "@/modules/api/graphql/queries/types/user-capstone-progress"

/** Milestones shown before the "see more" link is offered (rest is long). */
const INITIAL_MILESTONES = 2

/**
 * Maps a passed task's score to an attention colour the eye catches fast:
 * high → success, mid → warning, low → danger. Bands match the capstone grading
 * thresholds (≥90 strong, ≥70 acceptable, below = weak).
 * @param score - the graded score (0–100).
 * @returns a `text-{token}` class for the score label.
 */
const scoreToneClass = (score: number): string => {
    if (score >= 90) {
        return "text-success"
    }
    if (score >= 70) {
        return "text-warning"
    }
    return "text-danger"
}

/** Props for {@link ProjectCard}. */
export interface ProjectCardProps extends WithClassNames<undefined> {
    /** The single course capstone progress to showcase (list-item data prop). */
    project: QueryUserCapstoneCourseProgress
}

/**
 * One personal-project capstone, rendered as a compact ROW (not a nested card —
 * the section's {@link import("@/components/blocks").LabeledCard} is the frame).
 * Layout: a framed rocket {@link IconTile}, the course title with a green
 * "✓ Verified by StarCi" chip + overall percent, a single honest
 * {@link SegmentBar} whose green fill = graded/verified tasks out of all tasks,
 * and a milestone/task summary line. A presentational disclosure reveals the
 * per-milestone roadmap (each milestone = mini {@link ProgressMeter} + its task
 * rows). Green (`success`) means "verified" throughout, per the profile spec.
 *
 * @param props - {@link ProjectCardProps}
 */
export const ProjectCard = ({
    project,
    className,
}: ProjectCardProps) => {
    const t = useTranslations()
    const locale = useLocale()

    /** Whether the milestone/task detail disclosure is open. */
    const [expanded, setExpanded] = useState(false)
    /** Whether the full roadmap is shown (vs. just the first few milestones). */
    const [showAllMilestones, setShowAllMilestones] = useState(false)

    // milestones ordered along the roadmap (defensive copy before sort)
    const milestones = [
        ...project.milestones,
    ].sort((a, b) => a.position - b.position)

    // cap the roadmap to the first few milestones; the rest hides behind a link
    const visibleMilestones = showAllMilestones
        ? milestones
        : milestones.slice(0, INITIAL_MILESTONES)
    const hiddenMilestoneCount = milestones.length - INITIAL_MILESTONES

    const totalTasks = Math.max(project.totalTasks, 1)
    const percent = Math.round((project.completedTasks / totalTasks) * 100)
    const hasVerified = project.completedTasks > 0

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {/* glance row: framed icon + title/verify/% + verified-progress bar */}
            <div className="flex items-start gap-3">
                <IconTile
                    size="sm"
                    icon={<RocketIcon aria-hidden focusable="false" />}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <Typography type="body-sm" weight="medium" truncate>
                                {project.courseTitle}
                            </Typography>
                            {hasVerified ? (
                                <StatusChip
                                    tone="success"
                                    icon={<SealCheckIcon aria-hidden focusable="false" className="size-3" />}
                                >
                                    {t("pinnedProjects.verified")}
                                </StatusChip>
                            ) : null}
                        </div>
                        <Typography type="body-xs" color="muted">
                            {percent}%
                        </Typography>
                    </div>
                    <SegmentBar
                        hideLegend
                        max={totalTasks}
                        ariaLabel={`${project.courseTitle} · ${percent}%`}
                        segments={[
                            {
                                key: "verified",
                                label: t("publicProfile.capstone.projectsHeading"),
                                value: project.completedTasks,
                                color: "var(--success)",
                            },
                        ]}
                    />
                    <Typography type="body-xs" color="muted">
                        {t("publicProfile.capstone.roadmapSummary", {
                            completedMilestones: project.completedMilestones,
                            totalMilestones: project.totalMilestones,
                            completedTasks: project.completedTasks,
                            totalTasks: project.totalTasks,
                        })}
                    </Typography>
                </div>
            </div>

            {/* presentational disclosure → per-milestone roadmap (on demand) */}
            {milestones.length > 0 ? (
                <Link
                    onPress={() => setExpanded((open) => !open)}
                    className="group inline-flex w-fit cursor-pointer items-center gap-2 text-accent"
                >
                    {expanded
                        ? t("publicProfile.capstone.hideTasks")
                        : t("publicProfile.capstone.viewTasks")}
                    <CaretDownIcon
                        aria-hidden
                        focusable="false"
                        className="size-4 transition-transform data-[open=true]:rotate-180"
                        data-open={expanded}
                    />
                </Link>
            ) : null}

            {expanded ? (
                <div className="flex flex-col gap-4 pt-1">
                    {visibleMilestones.map((milestone, milestoneIndex) => (
                        <div
                            key={`${milestone.title}-detail-${milestoneIndex}`}
                            className="flex flex-col gap-2"
                        >
                            <ProgressMeter
                                label={milestone.title}
                                value={milestone.passedTasks}
                                max={Math.max(milestone.totalTasks, 1)}
                                showValue
                            />
                            <div className="flex flex-col gap-0">
                                {milestone.tasks.map((task, taskIndex) => (
                                    <ListRow
                                        key={`${task.title}-${taskIndex}`}
                                        leading={task.passed ? (
                                            <CheckCircleIcon aria-hidden focusable="false" className="size-5 text-success" />
                                        ) : undefined}
                                        title={task.title}
                                        meta={task.passed ? (
                                            <div className="flex items-center gap-2">
                                                {/* score coloured by band so the eye catches weak grades */}
                                                <Typography
                                                    type="body-xs"
                                                    weight="medium"
                                                    className={scoreToneClass(task.score)}
                                                >
                                                    {t("publicProfile.capstone.score", { score: task.score })}
                                                </Typography>
                                                {task.passedAt ? (
                                                    <Typography type="body-xs" color="muted">
                                                        {` · ${new Date(task.passedAt).toLocaleDateString(locale)}`}
                                                    </Typography>
                                                ) : null}
                                            </div>
                                        ) : undefined}
                                        divider={taskIndex < milestone.tasks.length - 1}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* roadmap is long → reveal the rest behind one link */}
                    {hiddenMilestoneCount > 0 ? (
                        <Link
                            onPress={() => setShowAllMilestones((open) => !open)}
                            className="inline-flex w-fit cursor-pointer items-center gap-2 text-accent"
                        >
                            {showAllMilestones
                                ? t("publicProfile.capstone.showLess")
                                : t("publicProfile.capstone.showMore", { count: hiddenMilestoneCount })}
                        </Link>
                    ) : null}
                </div>
            ) : null}
        </div>
    )
}
