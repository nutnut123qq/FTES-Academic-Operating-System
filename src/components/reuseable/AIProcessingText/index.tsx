"use client"

import { CircleCheck as CheckCircleIcon, LayoutList as QueueIcon, OctagonXmark as WarningOctagonIcon, Sparkles as SparkleIcon } from "@gravity-ui/icons"
import React, { useMemo } from "react"
import {
    motion,
    useReducedMotion,
} from "framer-motion"
import { useTranslations } from "next-intl"
import { cn } from "@heroui/react"
import { JobCategory } from "@/modules/types/enums/job-category"
import { JobStatus } from "@/modules/types/enums/job-status"
import { WithClassNames } from "@/modules/types/base/class-name"
import { resolveAiProcessingCopy } from "@/components/utils/ai"

export interface AIProcessingTextProps extends WithClassNames<{
    innerPanel?: string
    icon?: string
}> {
    jobCategory: JobCategory
    jobStatus: JobStatus
    error?: string
    showIcon?: boolean
}

const defaultIconClassName = "size-10 shrink-0"

/**
 * Theme CSS variable for border / spinner accent (aligns with status icon colors).
 */
const accentCssVarForStatus = (status: JobStatus): string => {
    switch (status) {
    case JobStatus.Queued:
    case JobStatus.Processing:
        return "var(--warning)"
    case JobStatus.Completed:
        return "var(--success)"
    case JobStatus.Failed:
        return "var(--danger)"
    default:
        return "var(--warning)"
    }
}

const useSpinningBorder = (status: JobStatus): boolean =>
    status === JobStatus.Queued 
|| status === JobStatus.Processing 
|| status === JobStatus.Completed
|| status === JobStatus.Failed

/**
 * Localized title + description for an AI job (same keys as {@link AIProcessingModal}).
 * @param props - {@link AIProcessingTextProps}
 */
export const AIProcessingText = (props: AIProcessingTextProps) => {
    const {
        jobCategory,
        jobStatus,
        error,
        showIcon = true,
        classNames,
        className,
    } = props
    const t = useTranslations()
    const prefersReducedMotion = useReducedMotion()
    const accentVar = useMemo(
        () => accentCssVarForStatus(jobStatus),
        [
            jobStatus,
        ],
    )
    const spinningBorder = useSpinningBorder(jobStatus)
    const copy = useMemo(
        () => resolveAiProcessingCopy(
            t,
            {
                jobCategory,
                jobStatus,
                error,
            },
        ),
        [
            t,
            jobCategory,
            jobStatus,
            error,
        ],
    )
    const statusIcon = useMemo(() => {
        switch (jobStatus) {
        case JobStatus.Queued:
            return <QueueIcon className={cn(classNames?.icon, defaultIconClassName, "text-muted animate-pulse")} />
        case JobStatus.Processing:
            return <SparkleIcon className={cn(classNames?.icon, defaultIconClassName, "text-warning animate-pulse")} />
        case JobStatus.Completed:
            return <CheckCircleIcon className={cn(classNames?.icon, defaultIconClassName, "text-success")} />
        case JobStatus.Failed:
            return <WarningOctagonIcon className={cn(classNames?.icon, defaultIconClassName, "text-danger")} />
        default:
            return null
        }
    }, [
        jobStatus,
        classNames?.icon,
    ])
    if (!copy) {
        return null
    }
    if (showIcon && !statusIcon) {
        return null
    }
    const textBlock = (
        <>
            <div className="text-sm font-medium text-foreground mb-1">{copy.title}</div>
            <div className="text-xs text-muted">{copy.description}</div>
            {jobStatus === JobStatus.Failed && copy.error && (
                <div className="mt-1 break-all text-xs text-danger">{copy.error}</div>
            )}
        </>
    )
    const innerBody = !showIcon ? (
        <div className="w-full min-w-0 text-center">
            {textBlock}
        </div>
    ) : (
        <div className="flex w-full items-center gap-1.5">
            {statusIcon}
            <div className="w-full min-w-0">
                {textBlock}
            </div>
        </div>
    )

    if (spinningBorder) {
        return (
            <div className={cn("relative overflow-hidden rounded-2xl p-[2px]", className)}>
                <motion.div
                    className={cn(
                        "pointer-events-none absolute left-1/2 top-1/2 aspect-square h-[220%] min-h-[140%] w-[220%] min-w-[140%]",
                        "-translate-x-1/2 -translate-y-1/2",
                    )}
                    style={{
                        background: `conic-gradient(from 0deg, transparent 0deg, transparent 220deg, ${accentVar} 275deg, transparent 320deg)`,
                    }}
                    aria-hidden
                    animate={
                        prefersReducedMotion
                            ? {
                                rotate: 0,
                            }
                            : {
                                rotate: 360,
                            }
                    }
                    transition={
                        prefersReducedMotion
                            ? {
                                duration: 0,
                            }
                            : {
                                repeat: Infinity,
                                duration: 2.8,
                                ease: "linear",
                            }
                    }
                />
                <div className={cn("relative z-[1] rounded-[calc(1rem-2px)] bg-background p-3", classNames?.innerPanel)}>
                    {innerBody}
                </div>
            </div>
        )
    }
    return (
        <div
            className={
                cn(
                    "rounded-3xl border-2 border-solid bg-background p-3",
                    className,
                )
            }
            style={{
                borderColor: accentVar,
            }}
        >
            {innerBody}
        </div>
    )
}
