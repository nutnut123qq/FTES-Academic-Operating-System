"use client"

import React from "react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"

/** Representative changelog rows shown while entries load. */
const SKELETON_ROW_COUNT = 4

/**
 * Loading placeholder for {@link import("../").ChangelogList}: mirrors the surface
 * list card — each row a meta line (date + category chip) over a title and body
 * line — so the loaded list does not jump in.
 *
 * @param props - {@link ChangelogListSkeleton}
 */
export const ChangelogListSkeleton = ({ className }: WithClassNames<undefined>) => {
    return (
        <SurfaceListCard className={className}>
            {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
                <SurfaceListCardItem key={index}>
                    <div className="flex flex-col gap-2">
                        {/* meta: date + category chip */}
                        <div className="flex items-center gap-2">
                            <Skeleton.Typography type="body-xs" width="1/4" />
                            <Skeleton className="h-4 w-16 shrink-0 rounded-full" />
                        </div>
                        {/* title */}
                        <Skeleton.Typography type="body-sm" width="3/4" />
                        {/* body */}
                        <Skeleton.Typography type="body-sm" width="1/2" />
                    </div>
                </SurfaceListCardItem>
            ))}
        </SurfaceListCard>
    )
}
