"use client"

import React from "react"
import {
    Card,
    Skeleton,
} from "@heroui/react"
import {
    cn,
} from "@heroui/react"
import { SkeletonParagraph } from "@/components/reuseable/SkeletonParagraph"
import { SkeletonText } from "@/components/reuseable/SkeletonText"
import type { WithClassNames } from "@/modules/types/base/class-name"

export type TierCardSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link TierCard}.
 *
 * Presentational: mirrors paid tier Card (title, description, price, USD block,
 * CTA, footer credits). The popular chip is not skeletonized.
 * @param props.className - Optional wrapper class.
 */
export const TierCardSkeleton = ({
    className,
}: TierCardSkeletonProps) => {
    return (
        <Card className={cn("flex h-full flex-col", className)}>
            <Card.Content className="flex flex-1 flex-col gap-3">
                <div className="flex items-center gap-2">
                    <Skeleton className="size-6 shrink-0 rounded-full" />
                    <SkeletonText
                        size="lg"
                        width="w-16"
                    />
                </div>
                <div className="h-[2lh] text-sm leading-normal">
                    <SkeletonParagraph
                        size="sm"
                        lines={2}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                        <SkeletonText
                            size="3xl"
                            width="w-32"
                        />
                        <SkeletonText
                            size="sm"
                            width="w-14"
                        />
                    </div>
                    <div className="h-[3lh] text-sm leading-normal">
                        <SkeletonParagraph
                            size="sm"
                            lines={3}
                        />
                    </div>
                </div>
                <Skeleton className="h-9 w-full rounded-full" />
            </Card.Content>
            <Card.Footer>
                <div className="flex flex-col gap-2 text-sm">
                    <div className="flex min-h-5 items-center gap-2">
                        <Skeleton className="size-5 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1">
                            <SkeletonText
                                size="sm"
                                width="w-2/3"
                            />
                        </div>
                    </div>
                    <div className="flex min-h-5 items-center gap-2">
                        <Skeleton className="size-5 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1">
                            <SkeletonText
                                size="sm"
                                width="w-1/2"
                            />
                        </div>
                    </div>
                </div>
            </Card.Footer>
        </Card>
    )
}
