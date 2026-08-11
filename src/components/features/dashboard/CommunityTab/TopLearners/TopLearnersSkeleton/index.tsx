"use client"

import React from "react"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Placeholder row count — mirrors the loaded top-N slice. */
const SKELETON_ROWS = 5

/** Props for {@link TopLearnersSkeleton}. */
export type TopLearnersSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("../").TopLearners} — mirrors the real ranked
 * list: a `SurfaceListCard` of rows shaped [rank · avatar · name · XP].
 *
 * The standing header is deliberately NOT mirrored: it renders only when the viewer
 * appears on the fetched board, which is the minority case, so including it would make
 * the placeholder taller than the resolved card for most viewers.
 *
 * @param props - {@link TopLearnersSkeletonProps}
 */
export const TopLearnersSkeleton = ({ className }: TopLearnersSkeletonProps) => (
    <SurfaceListCard className={className}>
        {Array.from({ length: SKELETON_ROWS }).map((_row, index) => (
            <SurfaceListCardItem key={index}>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-8 shrink-0 rounded-sm" />
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <Skeleton.Typography type="body-sm" width="1/2" className="min-w-0 flex-1" />
                    <Skeleton className="h-3 w-12 shrink-0 rounded-sm" />
                </div>
            </SurfaceListCardItem>
        ))}
    </SurfaceListCard>
)
