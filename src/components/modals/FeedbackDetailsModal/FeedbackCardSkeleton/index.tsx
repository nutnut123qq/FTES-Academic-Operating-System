"use client"

import React from "react"
import { Card, cn, Skeleton } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link FeedbackCardSkeleton}.
 */
type FeedbackCardSkeletonProps = WithClassNames<undefined>
/**
 * Loading placeholders for feedback cards.
 *
 * @param props - Skeleton config.
 */
export const FeedbackCardSkeleton = ({ className }: FeedbackCardSkeletonProps) => {
    return (
        <Card className={cn("w-full border border-default bg-surface p-0 shadow-none", className)}>
            <Card.Content>
                <div className="p-3">
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton className="h-[14px] w-2/5 my-[3px] rounded-sm" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="h-3" />
                    <div className="flex flex-col">
                        <Skeleton className="h-[14px] w-full my-[3px] rounded-sm" />
                        <Skeleton className="h-[14px] w-3/4 my-[3px] rounded-sm" />
                    </div>
                    <div className="h-3" />
                    <div className="flex items-center gap-1.5">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-[14px] w-1/5 my-[3px] rounded-sm" />
                    </div>
                </div>
                <div className="border-b border-divider" />
                <div className="p-3">
                    <div className="flex flex-col">
                        <Skeleton className="h-[14px] w-full my-[3px] rounded-sm" />
                        <Skeleton className="h-[14px] w-1/4 my-[3px] rounded-sm" />
                    </div>
                </div>
            </Card.Content>
        </Card>
    )
}

