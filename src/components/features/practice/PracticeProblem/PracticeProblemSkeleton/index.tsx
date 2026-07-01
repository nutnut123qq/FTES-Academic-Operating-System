"use client"

import React from "react"
import {
    Card,
    CardContent,
    Skeleton,
} from "@heroui/react"
import { SkeletonParagraph } from "@/components/reuseable/SkeletonParagraph"
import { SkeletonText } from "@/components/reuseable/SkeletonText"

/**
 * Loading placeholder for {@link PracticeProblem}. Mirrors the two-column detail:
 * left = statement + sample testcases; right = language selector + code editor +
 * submit button.
 */
export const PracticeProblemSkeleton = () => {
    return (
        <div className="mx-auto grid max-w-7xl gap-6 p-4 lg:grid-cols-2">
            {/* ── left: statement + samples ── */}
            <Card>
                <CardContent className="flex flex-col gap-3">
                    {/* title + difficulty chip */}
                    <div className="flex items-center justify-between gap-1.5">
                        <SkeletonText size="xl" width="w-1/2" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    {/* statement markdown */}
                    <SkeletonParagraph size="sm" lines={6} />
                    {/* sample testcases */}
                    <div className="flex flex-col gap-3">
                        <div className="border-t border-default-200" />
                        <SkeletonText size="base" width="w-24" />
                        <Skeleton className="h-20 w-full rounded-medium" />
                        <Skeleton className="h-20 w-full rounded-medium" />
                    </div>
                </CardContent>
            </Card>

            {/* ── right: editor + submit ── */}
            <div className="flex flex-col gap-3">
                <Card>
                    <CardContent className="flex flex-col gap-3">
                        {/* language selector */}
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Skeleton className="h-8 w-20 rounded-xl" />
                            <Skeleton className="h-8 w-20 rounded-xl" />
                            <Skeleton className="h-8 w-20 rounded-xl" />
                        </div>
                        {/* code editor */}
                        <Skeleton className="h-[420px] w-full rounded-medium" />
                        {/* submit button */}
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
