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

/** Props for {@link GlobalStandingSkeleton}. */
export type GlobalStandingSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("../").GlobalStanding}: mirrors the
 * LabeledCard (label outside + a single rank line in the card) so the block does
 * not collapse / jump when the global leaderboard resolves.
 * @param props - {@link GlobalStandingSkeletonProps}
 */
export const GlobalStandingSkeleton = ({ className }: GlobalStandingSkeletonProps) => (
    <div className={cn("flex flex-col gap-3", className)}>
        <Skeleton.Typography type="body-sm" width="1/3" />
        <Card>
            <CardContent>
                <Skeleton.Typography type="body" width="2/3" />
            </CardContent>
        </Card>
    </div>
)
