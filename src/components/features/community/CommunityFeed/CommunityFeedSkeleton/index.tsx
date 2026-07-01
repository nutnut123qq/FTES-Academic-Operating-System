"use client"

import React from "react"
import {
    Card,
    CardContent,
    Skeleton,
} from "@heroui/react"

/**
 * Loading skeleton for the community feed — mirrors a short stack of post cards so
 * the layout does not jump when the real posts resolve.
 */
export const CommunityFeedSkeleton = () => {
    return (
        <div className="flex flex-col gap-6">
            {[0, 1, 2].map((index) => (
                <Card key={index}>
                    <CardContent>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="size-10 rounded-full" />
                                <div className="flex flex-1 flex-col gap-2">
                                    <Skeleton className="h-3 w-32 rounded-full" />
                                    <Skeleton className="h-3 w-48 rounded-full" />
                                </div>
                            </div>
                            <Skeleton className="h-16 w-full rounded-xl" />
                            <Skeleton className="h-4 w-24 rounded-full" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
