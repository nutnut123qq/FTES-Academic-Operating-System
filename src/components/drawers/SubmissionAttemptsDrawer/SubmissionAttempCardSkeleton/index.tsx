import { cn } from "@heroui/react"
import { Card, Skeleton } from "@heroui/react"
import React from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Skeleton for a submission attempt card.
 */
export type SubmissionAttemptCardSkeletonProps = WithClassNames<undefined>
export const SubmissionAttemptCardSkeleton = (props: SubmissionAttemptCardSkeletonProps) => {
    const { className } = props
    return (
        <Card className={cn("border border-divider bg-transparent shadow-none", className)}>
            <Card.Content>
                <div>
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton className="h-[14px] w-32 my-[3px] rounded-sm" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <div className="h-3" />
                    <div className="flex flex-col">
                        <Skeleton className="h-[14px] my-[3px] w-full rounded-sm" />
                        <Skeleton className="h-[14px] my-[3px] w-3/4 rounded-sm" />
                    </div>
                    <div className="h-3" />
                    <div className="flex gap-1.5">
                        <Skeleton className="h-9 w-28 rounded-full" />
                        <Skeleton className="h-9 w-36 rounded-full" />
                    </div>
                </div>
            </Card.Content>
        </Card>
    )
}