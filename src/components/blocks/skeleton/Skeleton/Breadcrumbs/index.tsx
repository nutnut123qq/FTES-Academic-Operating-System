import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonBreadcrumbs}. */
export interface SkeletonBreadcrumbsProps extends WithClassNames<undefined> {
    /** Number of breadcrumb crumbs. Defaults to 3. */
    count?: number
}

/**
 * Skeleton matching a HeroUI <Breadcrumbs/>: count crumb bars
 * (link text-sm/leading-5 -> h-[14px] my-[3px]) interleaved with size-3
 * separator icons.
 */
export const SkeletonBreadcrumbs = ({
    className,
    count = 3,
}: SkeletonBreadcrumbsProps) => {
    return (
        <div className={cn("flex items-center", className)}>
            {Array.from({ length: count }).map((_, index) => (
                <React.Fragment key={index}>
                    {/* Crumb item wrapper (px-0.5) */}
                    <div className="flex shrink-0 items-center px-0.5">
                        <Skeleton className="my-[3px] h-[14px] w-16 rounded" />
                    </div>
                    {/* Separator (size-3), omitted after the last crumb */}
                    {index < count - 1 && (
                        <Skeleton className="size-3 rounded-xs" />
                    )}
                </React.Fragment>
            ))}
        </div>
    )
}
