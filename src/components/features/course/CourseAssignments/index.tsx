"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
    useQueryAssignmentsSwr,
    type AssignmentStatus,
} from "../hooks/useQueryAssignmentsSwr"

/** Chip color per status. */
const STATUS_COLOR: Record<AssignmentStatus, "success" | "warning" | "danger"> = {
    submitted: "success",
    pending: "warning",
    overdue: "danger",
}

/**
 * Course assignments (§4). DEFAULT on-canon layout: a list of assignment rows
 * with a due label + a status chip. ponytail: rows hand-rolled; mock data.
 */
export const CourseAssignments = () => {
    const t = useTranslations("courseSystem")
    const { courseId } = useParams<{ courseId: string }>()
    const { assignments } = useQueryAssignmentsSwr(courseId)

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
            <Typography type="h4" weight="bold">
                {t("assignments.title")}
            </Typography>
            {assignments.map((assignment) => (
                <div
                    key={assignment.id}
                    className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                >
                    <div className="min-w-0 flex-1">
                        <Typography type="body-sm" weight="medium" truncate>
                            {assignment.title}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {assignment.dueLabel}
                        </Typography>
                    </div>
                    <Chip size="sm" variant="soft" color={STATUS_COLOR[assignment.status]}>
                        {t(`assignments.status.${assignment.status}`)}
                    </Chip>
                </div>
            ))}
        </div>
    )
}
