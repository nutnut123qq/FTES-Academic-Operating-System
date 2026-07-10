import React from "react"
import { Card, CardContent } from "@heroui/react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Skeleton for the Q&A list — mirrors a few question rows. */
export const CourseQaSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
            <Card key={row}>
                <CardContent className="flex items-start gap-3">
                    <Skeleton className="size-8 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-3 w-40 rounded-md" />
                        <Skeleton className="h-3 w-full rounded-md" />
                        <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
)
