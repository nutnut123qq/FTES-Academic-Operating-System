"use client"

import React from "react"
import {
    useTranslations,
} from "next-intl"
import {
    UserPlusIcon,
} from "@phosphor-icons/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SectionCard } from "@/components/reuseable/SectionCard"

/** Number of placeholder suggestion rows shown while suggestions load. */
const SKELETON_ROW_COUNT = 4

/** Props for {@link WhoToFollowSkeleton}. */
export type WhoToFollowSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for {@link import("../").WhoToFollow}: mirrors the real
 * "who to follow" card — the same `SectionCard` (icon + title) wrapping rows of
 * [avatar · name + @username · follow button] at the same spacing — so the card
 * does not pop in / jump when the suggestions query resolves.
 *
 * @param props - {@link WhoToFollowSkeletonProps}
 */
export const WhoToFollowSkeleton = ({ className }: WhoToFollowSkeletonProps) => {
    const t = useTranslations()
    return (
        <SectionCard
            icon={<UserPlusIcon className="size-5 text-accent" />}
            title={t("dashboard.whoToFollow.title")}
            className={className}
        >
            <div className="flex flex-col gap-1.5">
                {Array.from({ length: SKELETON_ROW_COUNT }).map((_row, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-3 px-1.5 py-1"
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                            <Skeleton className="size-6 shrink-0 rounded-full" />
                            <div className="flex min-w-0 flex-1 flex-col gap-0">
                                <Skeleton.Typography type="body-sm" width="1/2" />
                                <Skeleton.Typography type="body-xs" width="1/3" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-20 shrink-0 rounded-medium" />
                    </div>
                ))}
            </div>
        </SectionCard>
    )
}
