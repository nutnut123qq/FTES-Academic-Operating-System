"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/** Representative week columns shown (the real grid is ~53, draggable past the viewport). */
const WEEK_COLUMNS = 26

/** Rows per week column (Sun→Sat). */
const WEEK_ROWS = 7

/** Year-switcher button placeholders (current + 2 back). */
const YEAR_BUTTONS = 3

/**
 * Loading placeholder for {@link import("../").OverviewContributions}: mirrors the
 * {@link import("@/components/reuseable/ContributionCalendarView").ContributionCalendarView}
 * heatmap — header (count + year switcher), the 7×N cell grid, and the Less→More
 * legend — at the same cell size / gaps so the box does not jump when data resolves.
 *
 * @param props - {@link OverviewContributionsSkeleton}
 */
export const OverviewContributionsSkeleton = ({ className }: WithClassNames<undefined>) => {
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {/* header: count text (left) + year switcher (right) */}
            <div className="flex items-center justify-between gap-3">
                <Skeleton.Typography type="body-sm" width="1/3" />
                <div className="flex items-center gap-2">
                    {Array.from({ length: YEAR_BUTTONS }).map((_, index) => (
                        <Skeleton key={index} className="h-5 w-10 rounded-medium" />
                    ))}
                </div>
            </div>

            {/* grid: weekday label column + N week columns of 7 cells */}
            <div className="flex gap-[3px] overflow-hidden">
                <div className="w-8 shrink-0" />
                {Array.from({ length: WEEK_COLUMNS }).map((_, columnIndex) => (
                    <div key={columnIndex} className="flex shrink-0 flex-col gap-[3px]">
                        {Array.from({ length: WEEK_ROWS }).map((_cell, rowIndex) => (
                            <Skeleton key={rowIndex} className="size-3 shrink-0 rounded-sm" />
                        ))}
                    </div>
                ))}
            </div>

            {/* legend: Less → More (5 cells, right-aligned) */}
            <div className="flex items-center justify-end gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="size-3 shrink-0 rounded-sm" />
                ))}
            </div>
        </div>
    )
}
