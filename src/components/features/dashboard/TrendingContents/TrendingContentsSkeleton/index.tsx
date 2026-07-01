"use client"

import React from "react"
import {
    useTranslations,
} from "next-intl"
import {
    FlameIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SurfaceListCard, SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"

/** Number of placeholder rows shown while trending contents load. */
const SKELETON_ROW_COUNT = 5

/** Per-row token widths (varied so the list reads naturally, not a solid block). */
const ROW_WIDTHS = ["3/4", "1/2", "1/3", "3/4", "1/2"] as const

/** Props for {@link TrendingContentsSkeleton}. */
export type TrendingContentsSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("../").TrendingContents}: mirrors the real
 * "Nổi bật tuần này" card — the same frameless `LabeledCard` (label + flame icon)
 * over a `SurfaceListCard` of rank-box + title rows — so the card does not pop in
 * / jump when the trending query resolves.
 *
 * @param props - {@link TrendingContentsSkeletonProps}
 */
export const TrendingContentsSkeleton = ({ className }: TrendingContentsSkeletonProps) => {
    const t = useTranslations()
    return (
        <LabeledCard
            frameless
            className={className}
            label={t("dashboard.trending.title")}
            icon={<FlameIcon aria-hidden focusable="false" className="size-5 text-accent" />}
        >
            <SurfaceListCard>
                {ROW_WIDTHS.slice(0, SKELETON_ROW_COUNT).map((width, index) => (
                    <SurfaceListCardItem key={index}>
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-5 shrink-0 rounded" />
                            <Skeleton.Typography type="body-sm" width={width} />
                        </div>
                    </SurfaceListCardItem>
                ))}
            </SurfaceListCard>
        </LabeledCard>
    )
}
