"use client"

import React from "react"
import {
    Skeleton,
} from "@heroui/react"
import { SkeletonText } from "@/components/reuseable/SkeletonText"
import { SkeletonParagraph } from "@/components/reuseable/SkeletonParagraph"

/**
 * Placeholder for the content header (title, description, meta chips) shown
 * while the content entity is loading.
 *
 * Presentational: static skeleton, no props or logic. The title mirrors the
 * real `text-2xl` heading and the description mirrors the `text-sm` body, so
 * the layout does not shift when data arrives. The meta chip is a non-text
 * block, so it keeps a raw `Skeleton`.
 */
export const ContentHeaderSkeleton = () => {
    return (
        <div className="flex flex-col gap-3 p-3">
            <SkeletonText size="2xl" width="w-1/2" />
            <SkeletonParagraph size="sm" lines={3} />
            <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-7 w-[120px] rounded-full" />
                <Skeleton className="h-7 w-[100px] rounded-full" />
            </div>
        </div>
    )
}
