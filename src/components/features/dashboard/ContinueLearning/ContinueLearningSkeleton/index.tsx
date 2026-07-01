"use client"

import React from "react"
import {
    Card,
    CardContent,
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Props for {@link ContinueLearningSkeleton}. */
export type ContinueLearningSkeletonProps = WithClassNames<undefined>

/**
 * Loading skeleton for {@link import("..").ContinueLearning}. Mirrors the loaded
 * resume-cards grid — three placeholder cards in the same
 * `sm:grid-cols-2 lg:grid-cols-3` layout, each echoing a {@link import("../ResumeCard").ResumeCard}
 * (leading icon dot → title + subtitle lines → CTA line) — so the section reserves
 * its real height and never collapses or jumps when the leaf queries resolve.
 * @param props - optional className for the root element (placement only).
 */
export const ContinueLearningSkeleton = ({
    className,
}: ContinueLearningSkeletonProps) => (
    <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
        {[0, 1, 2].map((card) => (
            <Card key={card} className="h-full">
                <CardContent className="flex h-full flex-col items-start gap-3">
                    <Skeleton className="size-5 shrink-0 rounded-full" />
                    <div className="flex w-full flex-col gap-2">
                        <Skeleton.Typography type="body-sm" width="3/4" />
                        <Skeleton.Typography type="body-sm" width="1/2" />
                    </div>
                    <Skeleton className="h-4 w-24 rounded-medium" />
                </CardContent>
            </Card>
        ))}
    </div>
)

export default ContinueLearningSkeleton
