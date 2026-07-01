"use client"

import React, {
    useMemo,
} from "react"
import {
    Accordion,
    Chip,
    Typography,
    cn,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    CheckCircleIcon,
    CircleIcon,
    CircleHalfIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import {
    useSelectedCourse,
} from "../hooks/useSelectedCourse"
import { useQueryMyCourseOutlineSwr } from "@/hooks/swr/api/graphql/queries/useQueryMyCourseOutlineSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { ListRow } from "@/components/blocks/lists/ListRow"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { StatusChip } from "@/components/blocks/chips/StatusChip"
import type { StatusChipTone } from "@/components/blocks/chips/StatusChip"
import { fromGlobalId } from "@/modules/utils/globalId"
import type { MyCourseOutlineMilestone, MyCourseOutlinePayload } from "@/modules/api/graphql/queries/types/my-course-outline"

/** Props for {@link CourseMilestoneOutline}. */
export interface CourseMilestoneOutlineProps extends WithClassNames<undefined> {
    /**
     * Lower-cased trimmed search query. Milestones survive when their title matches
     * or any of their tasks match; surviving milestones keep only matching tasks.
     */
    search?: string
}

/** Number of placeholder accordion milestones shown while the outline loads. */
const SKELETON_MILESTONE_COUNT = 4

/** Accordion-card skin — `variant="surface"` bakes bg-surface + rounded; we add the border. */
const ACCORDION_CARD = "overflow-hidden border border-default"

/** Skeleton frame mirroring the surface accordion-card. */
const ACCORDION_CARD_SKELETON = "flex flex-col rounded-3xl border border-default bg-surface"

/** A milestone's roll-up completion state, derived from its tasks. */
type MilestoneState = "done" | "inProgress" | "todo"

/**
 * Roll a milestone's tasks up into one state: `done` when every task passed,
 * `inProgress` when at least one task is passed or attempted, else `todo`.
 *
 * @param milestone - The milestone with its tasks.
 * @returns The milestone's completion state.
 */
const milestoneState = (milestone: MyCourseOutlineMilestone): MilestoneState => {
    if (milestone.tasks.length === 0) {
        return "todo"
    }
    if (milestone.tasks.every((task) => task.completed)) {
        return "done"
    }
    if (milestone.tasks.some((task) => task.completed || task.lastScore > 0)) {
        return "inProgress"
    }
    return "todo"
}

/** Status-chip tone per milestone state. */
const STATE_TONE: Record<MilestoneState, StatusChipTone> = {
    done: "success",
    inProgress: "warning",
    todo: "neutral",
}

/**
 * Filter milestones + their tasks by a search query (same rule as the module
 * filter). Empty query → unchanged.
 *
 * @param milestones - The course's milestones.
 * @param query - Lower-cased trimmed search query.
 * @returns The filtered milestones.
 */
const filterMilestones = (
    milestones: Array<MyCourseOutlineMilestone>,
    query: string,
): Array<MyCourseOutlineMilestone> => {
    if (!query) {
        return milestones
    }
    const result: Array<MyCourseOutlineMilestone> = []
    for (const milestone of milestones) {
        const matches = milestone.title.toLowerCase().includes(query)
        const tasks = matches
            ? milestone.tasks
            : milestone.tasks.filter((task) => task.title.toLowerCase().includes(query))
        if (matches || tasks.length > 0) {
            result.push({ ...milestone, tasks })
        }
    }
    return result
}

/**
 * The milestone to open by default — the one holding the viewer's current task,
 * else the first not-yet-done milestone. Null when nothing is in flight.
 *
 * @param outline - The course outline payload.
 * @returns The milestone id to expand, or null.
 */
const resolveOpenMilestoneId = (outline: MyCourseOutlinePayload): string | null => {
    if (outline.currentTask?.milestoneId) {
        return outline.currentTask.milestoneId
    }
    const firstOpen = outline.milestones.find((milestone) => milestoneState(milestone) !== "done")
    return firstOpen?.id ?? null
}

/**
 * Course "Personal Project" tab: the capstone milestone → task tree of ONE
 * enrolled course as an accordion-card, each milestone showing a roll-up
 * completion status chip (done / in progress / not started) + a passed-count, and
 * each task showing its own pass state + latest score. Reads the same
 * `myCourseOutline` payload as the Contents tab — no extra query. The milestone
 * holding the viewer's current task opens by default.
 *
 * @param props - {@link CourseMilestoneOutlineProps}
 */
export const CourseMilestoneOutline = ({
    search = "",
    className,
}: CourseMilestoneOutlineProps) => {
    const t = useTranslations()
    const { selectedCourse } = useSelectedCourse()

    const rawCourseId = selectedCourse ? fromGlobalId(selectedCourse)?.id ?? null : null
    const outlineSwr = useQueryMyCourseOutlineSwr(rawCourseId)
    const outline = outlineSwr.data

    const query = search.trim().toLowerCase()
    const milestones = useMemo(
        () => (outline ? filterMilestones(outline.milestones, query) : []),
        [outline, query],
    )
    const defaultOpenId = useMemo(
        () => (outline && !query ? resolveOpenMilestoneId(outline) : null),
        [outline, query],
    )

    return (
        <AsyncContent
            isLoading={outlineSwr.data === null || outlineSwr.data === undefined ? !outlineSwr.error : false}
            skeleton={(
                <div className={cn(ACCORDION_CARD_SKELETON, className)}>
                    {Array.from({ length: SKELETON_MILESTONE_COUNT }).map((_unused, index) => (
                        <div key={index} className="flex items-center justify-between gap-3 border-b border-default p-4 last:border-b-0">
                            <Skeleton.Typography type="body" width="1/2" />
                            <Skeleton className="h-5 w-20 rounded-full" />
                        </div>
                    ))}
                </div>
            )}
            isEmpty={!outline || outline.milestones.length === 0}
            emptyContent={{ title: t("profileSettings.learning.outline.milestonesEmpty") }}
            error={!outlineSwr.data ? outlineSwr.error : undefined}
            errorContent={{
                title: t("profileSettings.learning.outline.error"),
                onRetry: () => { void outlineSwr.mutate() },
                retryLabel: t("profileSettings.learning.loadMore"),
            }}
        >
            {milestones.length === 0 ? (
                <EmptyContent title={t("profileSettings.learning.outline.noMatch")} />
            ) : (
                <Accordion
                    variant="surface"
                    className={cn(ACCORDION_CARD, className)}
                    defaultExpandedKeys={defaultOpenId ? [defaultOpenId] : undefined}
                >
                    {milestones.map((milestone) => {
                        const state = milestoneState(milestone)
                        const done = milestone.tasks.filter((task) => task.completed).length
                        const total = milestone.tasks.length
                        return (
                            <Accordion.Item key={milestone.id} aria-label={milestone.title}>
                                <Accordion.Heading>
                                    <Accordion.Trigger>
                                        <div className="flex w-full items-center justify-between gap-3 text-start">
                                            <Typography type="body" weight="semibold" truncate>
                                                {milestone.title}
                                            </Typography>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <StatusChip tone={STATE_TONE[state]}>
                                                    {t(`profileSettings.learning.outline.milestoneStatus.${state}`)}
                                                </StatusChip>
                                                <Typography type="body-xs" color="muted">
                                                    {t("profileSettings.learning.outline.taskProgress", { done, total })}
                                                </Typography>
                                                <Accordion.Indicator />
                                            </div>
                                        </div>
                                    </Accordion.Trigger>
                                </Accordion.Heading>
                                <Accordion.Panel>
                                    <Accordion.Body>
                                        <div className="flex flex-col gap-2">
                                            {milestone.tasks.map((task) => {
                                                const attempted = !task.completed && task.lastScore > 0
                                                return (
                                                    <ListRow
                                                        key={task.id}
                                                        leading={task.completed ? (
                                                            <CheckCircleIcon aria-hidden focusable="false" className="size-5 text-success" />
                                                        ) : attempted ? (
                                                            <CircleHalfIcon aria-hidden focusable="false" className="size-5 text-warning" />
                                                        ) : (
                                                            <CircleIcon aria-hidden focusable="false" className="size-5 text-muted" />
                                                        )}
                                                        title={task.title}
                                                        meta={(
                                                            <>
                                                                {task.type ? (
                                                                    <Chip size="sm" variant="soft">
                                                                        <Chip.Label>
                                                                            {t(`profileSettings.learning.outline.taskType.${task.type}`)}
                                                                        </Chip.Label>
                                                                    </Chip>
                                                                ) : null}
                                                                {task.completed || attempted ? (
                                                                    <Typography type="body-xs" color="muted">
                                                                        {`${task.lastScore}/${task.maxScore}`}
                                                                    </Typography>
                                                                ) : null}
                                                            </>
                                                        )}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Panel>
                            </Accordion.Item>
                        )
                    })}
                </Accordion>
            )}
        </AsyncContent>
    )
}
