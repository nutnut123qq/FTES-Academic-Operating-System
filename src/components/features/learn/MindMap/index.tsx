"use client"

import React from "react"
import { Skeleton, cn } from "@heroui/react"
import { MindMapCanvas } from "./MindMapCanvas"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useAppSelector } from "@/redux/hooks"
import { useQueryCourseSwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseSwr"

/** Props for {@link MindMap}. */
export type MindMapProps = WithClassNames<undefined>

/**
 * Course mind-map feature container for the authenticated learn shell.
 *
 * Triggers the course fetch for hard refreshes, then mounts the full-bleed
 * {@link MindMapCanvas}. No breadcrumb / page chrome — the canvas owns the whole
 * viewport (its own on-canvas controls handle orientation). Mounted by the
 * `/[locale]/courses/[courseId]/learn/mind-map` route.
 *
 * Client component: relies on redux selectors.
 * @param props - optional className for the root element
 */
export const MindMap = ({
    className,
}: MindMapProps = {}) => {
    const course = useAppSelector((state) => state.course.entity)
    // Trigger the course fetch on this route (the /modules layout does it elsewhere, but a hard
    // refresh straight into /mind-map has no other loader, so the canvas would stay empty).
    const { isLoading } = useQueryCourseSwr()

    return (
        // full-bleed canvas filling the viewport below the sticky h-16 navbar
        <div className={cn("h-[calc(100dvh-4rem)] w-full", className)}>
            {!course && isLoading ? (
                <Skeleton className="h-full w-full" />
            ) : (
                <MindMapCanvas />
            )}
        </div>
    )
}
