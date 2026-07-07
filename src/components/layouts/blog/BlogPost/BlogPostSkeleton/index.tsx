import React from "react"
import { Skeleton } from "@heroui/react"

/**
 * Loading mirror for {@link import("../index").BlogPost} — chips, a tall title,
 * and several body lines, matching the article header + body rhythm.
 */
export const BlogPostSkeleton = () => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-10 w-3/4 rounded" />
                <Skeleton className="h-4 w-48 rounded" />
            </div>
            <div className="flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-4 w-full rounded" />
                ))}
                <Skeleton className="h-4 w-2/3 rounded" />
            </div>
        </div>
    )
}
