import React from "react"
import { Skeleton } from "@heroui/react"

/**
 * Loading mirror for {@link import("../index").BlogList} — a tall featured block
 * over a few text rows, matching the real lead + list rhythm so the layout never
 * jumps when data resolves.
 */
export const BlogListSkeleton = () => {
    return (
        <div className="flex flex-col gap-3">
            {/* featured lead */}
            <div className="flex flex-col gap-3 border-b border-default pb-6">
                <Skeleton className="h-5 w-28 rounded-full" />
                <Skeleton className="h-9 w-3/4 rounded" />
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-4 w-40 rounded" />
            </div>
            {/* rows */}
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="flex flex-col gap-2 border-b border-default py-4 last:border-b-0"
                >
                    <Skeleton className="h-6 w-2/3 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-3 w-48 rounded" />
                </div>
            ))}
        </div>
    )
}
