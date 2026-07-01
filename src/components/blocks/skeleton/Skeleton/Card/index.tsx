import React from "react"
import { Skeleton, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link SkeletonCard}. */
export interface SkeletonCardProps extends WithClassNames<undefined> {
    /** Number of body block lines. Defaults to 3. */
    lines?: number
}

/**
 * Skeleton matching a HeroUI <Card/> box: bordered container (p-4, gap-3,
 * rounded-[32px]) with a title bar (text-sm/leading-6 -> h-[14px] my-[5px])
 * over a body block of placeholder lines.
 */
export const SkeletonCard = ({ className, lines = 3 }: SkeletonCardProps) => {
    return (
        <div
            className={cn(
                "flex flex-col gap-3 rounded-[32px] bg-surface p-4 shadow-surface",
                className,
            )}
        >
            {/* Card title (text-sm/leading-6) */}
            <Skeleton className="my-[5px] h-[14px] w-1/2 rounded" />
            {/* Card content lines (body) */}
            <div className="flex flex-1 flex-col gap-2">
                {Array.from({ length: lines }).map((_, index) => (
                    <Skeleton
                        key={index}
                        className={cn(
                            "my-1.5 h-4 rounded",
                            index === lines - 1 ? "w-2/3" : "w-full",
                        )}
                    />
                ))}
            </div>
        </div>
    )
}
