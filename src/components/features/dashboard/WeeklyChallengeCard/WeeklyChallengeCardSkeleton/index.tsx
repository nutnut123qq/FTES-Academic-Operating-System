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

/** Recent-finisher rows shown while the weekly challenge loads. */
const SKELETON_ROW_COUNT = 3

/** Props for {@link WeeklyChallengeCardSkeleton}. */
export type WeeklyChallengeCardSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("../").WeeklyChallengeCard}: mirrors the real
 * "Thử thách tuần" card — the same `LabeledCard` (label + flame) wrapping the title,
 * the countdown + status row, the passer count, and a short finisher list — so the
 * card does not pop in / jump when the weekly-challenge query resolves.
 *
 * @param props - {@link WeeklyChallengeCardSkeletonProps}
 */
export const WeeklyChallengeCardSkeleton = ({ className }: WeeklyChallengeCardSkeletonProps) => {
    const t = useTranslations()
    return (
        <LabeledCard
            label={t("weeklyChallenge.title")}
            icon={<FlameIcon aria-hidden focusable="false" className="size-5" />}
            className={className}
            contentClassName="flex flex-col gap-3"
        >
            {/* featured challenge title */}
            <Skeleton.Typography type="body-sm" width="2/3" />

            {/* countdown (left) + status chip (right) */}
            <div className="flex items-center justify-between gap-3">
                <Skeleton.Typography type="body-xs" width="1/3" />
                <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
            </div>

            {/* total passers */}
            <Skeleton.Typography type="body-xs" width="1/4" />

            {/* recent finishers */}
            <div className="flex flex-col gap-2">
                {Array.from({ length: SKELETON_ROW_COUNT }).map((_row, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Skeleton className="size-6 shrink-0 rounded-full" />
                        <Skeleton className="h-4 flex-1 rounded-md" />
                        <Skeleton className="h-4 w-12 shrink-0 rounded-md" />
                    </div>
                ))}
            </div>
        </LabeledCard>
    )
}
