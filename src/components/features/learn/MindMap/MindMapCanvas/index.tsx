"use client"

import React from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Canvas } from "../Canvas"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link MindMapCanvas}. */
export type MindMapCanvasProps = WithClassNames<undefined>

/**
 * Shared React Flow mind-map canvas: provider wrapper and empty-state handling.
 *
 * Used by both {@link MindMap} (learn shell) and {@link StandaloneMindMap} (public route).
 * The authenticated canvas overlays the viewer's progress (per-module status, the "you
 * are here" module, overall completion) and a content-first "Continue" action; the public
 * standalone route degrades to a structure-only map. Clicking a lesson navigates straight
 * into its reader.
 * @param props - optional className (unused; layout is controlled by the parent container)
 */
export const MindMapCanvas = ({
    className,
}: MindMapCanvasProps = {}) => {
    const t = useTranslations()
    const course = useAppSelector((state) => state.course.entity)
    const hasModules = Boolean(course?.modules && course.modules.length > 0)

    if (!course) {
        return null
    }

    if (!hasModules) {
        return (
            <div className={cn("rounded-2xl border border-dashed  px-4 py-6 text-center text-sm text-muted dark:border-zinc-600", className)}>
                {t("content.mindMapEmpty")}
            </div>
        )
    }

    return (
        <ReactFlowProvider>
            <div className={cn("h-full w-full", className)}>
                <Canvas />
            </div>
        </ReactFlowProvider>
    )
}
