"use client"

import React, {
    useMemo,
} from "react"
import {
    Typography,
    cn,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    TaskSkeleton,
} from "./TaskSkeleton"
import {
    TaskLockedAlert,
} from "./TaskLockedAlert"
import {
    TaskBrief,
} from "./TaskBrief"
import {
    TaskCriteriaList,
} from "./TaskCriteriaList"
import {
    TaskCodeImplementations,
} from "./TaskCodeImplementations"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { RichText } from "@/components/reuseable/RichText"
import { useQueryMilestoneTaskSwr } from "@/hooks/swr/api/graphql/queries/useQueryMilestoneTaskSwr"

/** Props for {@link Task}. */
export type TaskProps = WithClassNames<undefined>

/**
 * Milestone task BRIEF column (left side of the split workspace).
 *
 * Reads the active task from redux and renders the reading content: title (H3) +
 * description, then the per-language brief (and the legacy public criteria /
 * implementation guides for old tasks that have no SCHEMA V2 brief). The
 * submission + evaluate + result actions live in the persistent right panel
 * ({@link import("./TaskSubmissionPanel").TaskSubmissionPanel}) — this column only
 * swaps per task; the panel persists across milestones. `"use client"` for redux.
 * @param props - optional className for the root element
 */
export const Task = ({
    className,
}: TaskProps = {}) => {
    const t = useTranslations()
    const milestoneTaskQuery = useQueryMilestoneTaskSwr()
    const milestoneEntities = useAppSelector((state) => state.milestone.entities)
    const selectedTaskDetail = useAppSelector((state) => state.milestone.selectedTaskDetail)
    const selectedTaskId = useAppSelector((state) => state.milestone.selectedTaskId)

    const taskFromMilestones = useMemo(() => {
        if (!selectedTaskId) return undefined
        for (const milestone of milestoneEntities) {
            const found = milestone.tasks?.find((task) => task.id === selectedTaskId)
            if (found) return found
        }
        return undefined
    }, [milestoneEntities, selectedTaskId])

    const displayTask = useMemo(() => {
        if (!selectedTaskId) return undefined
        if (selectedTaskDetail?.id === selectedTaskId) {
            return selectedTaskDetail
        }
        return taskFromMilestones
    }, [selectedTaskId, selectedTaskDetail, taskFromMilestones])

    const body = (
        // tier-2 header (title H3 + desc) stands alone; the brief renders itself as the
        // "Hướng dẫn" LabeledCard (TaskBrief), so each section here is its own labeled block.
        <div className={cn("flex flex-col gap-6", className)}>
            <div className="flex flex-col gap-2">
                <Typography type="h3" weight="bold">{displayTask?.title}</Typography>
                {displayTask?.description && (
                    <RichText text={displayTask.description} size="body-sm" color="muted" />
                )}
            </div>
            <TaskLockedAlert />
            <TaskBrief />
            {/* SCHEMA V2 tasks (with briefs) keep their rubric internal — the legacy
                public criteria + codeImplementations are only shown for old tasks. */}
            {(displayTask?.briefs?.length ?? 0) === 0 && (
                <div className="flex flex-col gap-3">
                    <Typography type="body" weight="semibold">
                        {t("task.criteriaTitle")}
                    </Typography>
                    <TaskCriteriaList />
                    <TaskCodeImplementations />
                </div>
            )}
        </div>
    )

    return (
        <AsyncContent
            isLoading={!displayTask || milestoneTaskQuery.isLoading || !selectedTaskId}
            skeleton={<TaskSkeleton />}
        >
            {body}
        </AsyncContent>
    )
}
