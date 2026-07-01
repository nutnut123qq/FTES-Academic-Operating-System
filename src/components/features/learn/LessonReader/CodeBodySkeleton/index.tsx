"use client"

import React from "react"
import {
    Skeleton,
    cn,
} from "@heroui/react"
import { SkeletonText } from "@/components/reuseable/SkeletonText"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CodeBodySkeleton}. */
export interface CodeBodySkeletonProps extends WithClassNames<undefined> {
    /** Number of placeholder code cards to render. Defaults to `2`. */
    count?: number
}

/**
 * Loading placeholder for the code-oriented content tabs (lesson / explaining /
 * implementation). Mirrors the real cards: a chip row, a `rounded-xl` editor
 * block, and a few stepped text lines suggesting an explanation.
 * @param props - {@link CodeBodySkeletonProps}
 */
export const CodeBodySkeleton = ({
    count = 2,
    className,
}: CodeBodySkeletonProps) => {
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            {Array.from({ length: Math.max(count, 1) }).map((_unused, index) => (
                <article
                    key={index}
                    className="rounded-xl border border-default-200 p-4 flex flex-col gap-3"
                >
                    {/* chip row (index + language chips) */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                    {/* the code editor block */}
                    <Skeleton className="h-40 w-full rounded-xl" />
                    {/* a few explanation lines of varying width */}
                    <SkeletonText size="sm" width="w-full" />
                    <SkeletonText size="sm" width="w-5/6" />
                    <SkeletonText size="sm" width="w-2/3" />
                </article>
            ))}
        </div>
    )
}
