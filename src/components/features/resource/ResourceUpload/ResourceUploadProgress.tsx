"use client"

import React from "react"
import { Typography, cn } from "@heroui/react"
import {
    CheckCircleIcon,
    CircleIcon,
    SpinnerGapIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"

import type { ResourceUploadStepView } from "./useResourceUploadFlow"

/** Props of {@link ResourceUploadProgress}. */
export interface ResourceUploadProgressProps {
    steps: Array<ResourceUploadStepView>
    /** Resolves a step key to its localized label (`upload.steps.<step>`). */
    labelOf: (step: ResourceUploadStepView["step"]) => string
    /** Accessible name of the overall progress bar. */
    progressLabel: string
}

/** Icon + tone per step status. */
const STEP_ICON = {
    done: { Icon: CheckCircleIcon, tone: "text-success" },
    running: { Icon: SpinnerGapIcon, tone: "text-accent animate-spin" },
    error: { Icon: WarningCircleIcon, tone: "text-danger" },
    idle: { Icon: CircleIcon, tone: "text-muted" },
} as const

/**
 * Progress of the publish chain — one row per step plus a bar of the completed
 * fraction. Purely presentational; the state machine lives in `uploadFlow.ts`.
 */
export const ResourceUploadProgress = ({
    steps,
    labelOf,
    progressLabel,
}: ResourceUploadProgressProps) => {
    const doneCount = steps.filter((row) => row.status === "done").length
    const percent = steps.length === 0 ? 0 : Math.round((doneCount / steps.length) * 100)

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator bg-default/40 p-4">
            <div
                role="progressbar"
                aria-label={progressLabel}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="h-1.5 w-full overflow-hidden rounded-full bg-separator"
            >
                <div
                    className="h-full rounded-full bg-accent transition-[width] duration-300"
                    style={{ width: `${percent}%` }}
                />
            </div>

            <ol className="flex flex-col gap-2">
                {steps.map((row) => {
                    const { Icon, tone } = STEP_ICON[row.status]
                    return (
                        <li key={row.step} className="flex items-center gap-2">
                            <Icon size={16} className={cn("shrink-0", tone)} />
                            <Typography
                                type="body-sm"
                                color={row.status === "idle" ? "muted" : "default"}
                                weight={row.status === "running" ? "medium" : "normal"}
                            >
                                {labelOf(row.step)}
                            </Typography>
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}
