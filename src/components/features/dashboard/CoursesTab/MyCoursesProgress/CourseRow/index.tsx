"use client"

import React from "react"
import {
    Typography,
} from "@heroui/react"
import {
    BookOpenIcon,
    CaretRightIcon,
} from "@phosphor-icons/react"
import {
    useTranslations,
} from "next-intl"
import {
    CourseTrialChip,
} from "@/components/reuseable/CourseTrialChip"
import {
    useResolveRouteNavigation,
} from "../../../EntityToken/useResolveRouteNavigation"
import type {
    QueryMyDashboardMilestoneProgressItemData,
} from "@/modules/api/graphql/queries/types/my-dashboard"
import { IconTile } from "@/components/blocks/identity/IconTile"
import { SegmentBar } from "@/components/blocks/stats/SegmentBar"
import { SurfaceListCardItem } from "@/components/blocks/cards/SurfaceListCard"

/** Segment colour per course progress dimension. */
const DIM_COLOR: Record<string, string> = {
    content: "var(--accent)",
    challenge: "var(--success)",
    milestone: "var(--warning)",
}

/** Props for {@link CourseRow}. */
export interface CourseRowProps {
    /** One enrolled-course progress item. */
    item: QueryMyDashboardMilestoneProgressItemData
}

/**
 * One enrolled course as a WHOLE-ROW clickable surface-list item: course tile +
 * title + overall %, with a single segmented bar folding content / challenge /
 * milestone into one honest bar (legend below). Pressing anywhere resolves the
 * course route and navigates — one {@link useResolveRouteNavigation} per row.
 *
 * @param props - {@link CourseRowProps}
 */
export const CourseRow = ({ item }: CourseRowProps) => {
    const t = useTranslations()
    const { onPress, pending, routable } = useResolveRouteNavigation({ globalId: item.globalId })

    const dims = [
        { key: "content", value: item.contentCompleted, total: item.contentTotal },
        { key: "challenge", value: item.challengeCompleted, total: item.challengeTotal },
        { key: "milestone", value: item.completed, total: item.total },
    ]
    const totalTasks = dims.reduce((acc, d) => acc + d.total, 0)

    return (
        <SurfaceListCardItem onPress={onPress} isDisabled={!routable || pending} hover="underline">
            <div className="flex items-center gap-3">
                <IconTile size="sm" src={item.thumbnailUrl} icon={<BookOpenIcon aria-hidden focusable="false" />} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <Typography type="body-sm" weight="medium" truncate className="min-w-0 flex-1 group-hover:underline">
                            {item.label}
                        </Typography>
                        <CourseTrialChip isEnrolled={item.isEnrolled} />
                        <Typography type="body-xs" color="muted">
                            {item.completionPercent}%
                        </Typography>
                    </div>
                    <SegmentBar
                        max={totalTasks || 1}
                        ariaLabel={`${item.label} · ${item.completionPercent}%`}
                        segments={dims.map((d) => ({
                            key: d.key,
                            label: t(`dashboard.courseProgress.${d.key}`),
                            value: d.value,
                            color: DIM_COLOR[d.key],
                        }))}
                    />
                </div>
                <CaretRightIcon aria-hidden focusable="false" className="size-5 shrink-0 text-muted" />
            </div>
        </SurfaceListCardItem>
    )
}
