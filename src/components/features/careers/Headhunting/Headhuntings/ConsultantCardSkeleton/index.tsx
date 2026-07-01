"use client"

import React from "react"
import { cn, Skeleton } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ConsultantCardSkeleton}. */
export type ConsultantCardSkeletonProps = WithClassNames<undefined>

/**
 * Loading placeholder for a consultant card in the grid — mirrors the avatar +
 * name + meta layout of {@link import("../ConsultantCard").ConsultantCard}.
 * @param props - {@link ConsultantCardSkeletonProps}
 */
export const ConsultantCardSkeleton = ({ className }: ConsultantCardSkeletonProps) => {
    return (
        <div className={cn("flex flex-col gap-3 rounded-3xl bg-surface px-4 py-3", className)}>
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg" />
            </div>
        </div>
    )
}
