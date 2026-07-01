"use client"

import React from "react"
import { Card, CardContent, Skeleton } from "@heroui/react"
import { cn } from "@heroui/react"
import { WithClassNames } from "@/modules/types/base/class-name"

export type ChallengeCardSkeletonProps = WithClassNames<undefined>

/**
 * Render loading placeholders for challenge cards.
 * @param {ChallengeCardSkeletonProps} props Skeleton props.
 */
export const ChallengeCardSkeleton = ({ className }: ChallengeCardSkeletonProps) => {
    return (
        <Card className={cn("", className)}>
            <CardContent>
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 my-1 w-3/4 rounded" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <Skeleton className="h-3 my-[2px] w-full rounded-sm" />
                        <Skeleton className="h-3 my-[2px] w-5/6 rounded-sm" />
                        <Skeleton className="h-3 my-[2px] w-4/6 rounded-sm" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-24 rounded-full" />
                        <Skeleton className="h-9 w-36 rounded-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
