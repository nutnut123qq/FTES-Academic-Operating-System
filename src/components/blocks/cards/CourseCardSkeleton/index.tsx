"use client"

import React from "react"
import {
    Card,
    Skeleton,
    cn,
} from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Loading placeholder mirroring {@link import("../CourseCard").CourseCard}'s layout
 * (cover, title, description lines, price, CTA) so the courses grid does not jump
 * when data resolves.
 */
export const CourseCardSkeleton = ({ className }: WithClassNames<undefined>) => {
    return (
        <Card className={cn("flex flex-col overflow-hidden", className)}>
            <Card.Content className="flex flex-col gap-3 p-0">
                <Skeleton className="aspect-video w-full rounded-2xl" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-2/3 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-5/6 rounded" />
                </div>
            </Card.Content>
            <Card.Footer className="flex flex-col gap-2 pt-3">
                <Skeleton className="h-6 w-1/3 rounded" />
                <Skeleton className="h-11 w-full rounded-2xl" />
            </Card.Footer>
        </Card>
    )
}
