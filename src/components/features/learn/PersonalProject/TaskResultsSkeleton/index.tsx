"use client"

import React from "react"
import {
    Skeleton,
    cn,
} from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { SkeletonText } from "@/components/reuseable/SkeletonText"
import { SkeletonParagraph } from "@/components/reuseable/SkeletonParagraph"

/** Props for {@link TaskResultsSkeleton}. */
export type TaskResultsSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("../TaskResults").TaskResults}.
 *
 * Mirrors the real result block 1:1 so nothing jumps when the latest attempt
 * lands: the title row (`font-semibold` label + AI badge pill) and the
 * `rounded-3xl` surface holding the `text-4xl` score + short feedback. Shown
 * via `AsyncContent` while the attempts query is on its first load.
 * @param props - optional className for the root element
 */
export const TaskResultsSkeleton = ({
    className,
}: TaskResultsSkeletonProps = {}) => {
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {/* title row: "Kết quả" label + StarCi AI badge */}
            <div className="flex items-center gap-2">
                <SkeletonText size="base" width="w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            {/* score + feedback surface (mirrors the rounded-3xl result card) */}
            <div className="rounded-3xl bg-default/40 p-3">
                {/* text-4xl score */}
                <Skeleton className="h-[36px] w-24 rounded my-[2px]" />
                <div className="mt-3 flex flex-col">
                    <SkeletonParagraph size="sm" lines={2} />
                </div>
            </div>
        </div>
    )
}
