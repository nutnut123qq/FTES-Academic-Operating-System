"use client"

import React, {
    useMemo,
} from "react"
import {
    useTranslations,
} from "next-intl"
import { AccordionSkeleton } from "@/components/reuseable/AccordionSkeleton"
import { SkeletonText } from "@/components/reuseable/SkeletonText"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link MilestoneOutlineSkeleton}. */
export interface MilestoneOutlineSkeletonProps extends WithClassNames<undefined> {
    /** Number of placeholder milestone rows to render. */
    count: number
}

/**
 * Loading placeholder for the milestone list inside {@link MilestoneOutline}.
 *
 * Mirrors {@link ModuleOutlineSkeleton}: renders only the list (the search +
 * separator stay mounted in the rail), using {@link AccordionSkeleton} so the
 * layout matches {@link MilestoneAccordion} — first row expanded with task lines.
 * @param props - the number of placeholder rows to render
 */
export const MilestoneOutlineSkeleton = ({
    count,
}: MilestoneOutlineSkeletonProps) => {
    const t = useTranslations()
    const items = useMemo(
        () => Array.from({ length: count }, (_, index) => ({
            ariaLabel: t("finalProject.aria", { index: index + 1 }),
            expanded: index === 0,
            titleSize: "base" as const,
            showIndicator: true,
        })),
        [
            count,
            t,
        ],
    )
    const renderExpandedBody = useMemo(
        () => () => (
            <div className="flex flex-col gap-2">
                <SkeletonText size="sm" className="w-3/4" />
                <SkeletonText size="xs" className="w-full" />
                <SkeletonText size="xs" className="w-3/4" />
            </div>
        ),
        [],
    )
    return (
        <AccordionSkeleton
            variant="default"
            items={items}
            renderExpandedBody={renderExpandedBody}
        />
    )
}
