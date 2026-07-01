"use client"

import React from "react"
import {
    Skeleton,
    cn,
} from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { SkeletonText } from "@/components/reuseable/SkeletonText"
import { SkeletonParagraph } from "@/components/reuseable/SkeletonParagraph"

/** Props for {@link TaskSkeleton}. */
export type TaskSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for the milestone task BRIEF column
 * ({@link import("../").Task}).
 *
 * Mirrors the real layout 1:1 so nothing jumps when the task lands: the
 * `gap-6` stack of the tier-2 header (H3 title `text-2xl` + `body-sm` description,
 * a tight pair) followed by the per-language brief card. Static-shaped, no logic.
 * @param props - optional className for the root element
 */
export const TaskSkeleton = ({
    className,
}: TaskSkeletonProps = {}) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {/* tier-2 header — title (H3) + description, the gap-0 pair */}
            <div className="flex flex-col gap-2">
                <SkeletonText size="2xl" width="w-2/3" />
                <SkeletonParagraph size="sm" lines={2} />
            </div>
            {/* per-language brief card */}
            <Skeleton className="h-[220px] w-full rounded-xl" />
        </div>
    )
}
