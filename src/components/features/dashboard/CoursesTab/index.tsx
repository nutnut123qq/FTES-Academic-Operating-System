"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    GraduationCapIcon,
} from "@phosphor-icons/react"
import {
    useTranslations,
} from "next-intl"
import {
    MyCoursesProgress,
} from "./MyCoursesProgress"
import {
    RecommendedCourses,
} from "../RecommendedCourses"
import {
    UpcomingLivestreamCard,
} from "../UpcomingLivestreamCard"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"

/** Props for {@link CoursesTab}. */
export type CoursesTabProps = WithClassNames<undefined>

/**
 * Dashboard "Courses" tab — everything about the viewer's learning path: enrolled-
 * course progress, recommended courses to pick up next, and upcoming live sessions.
 * Each child self-fetches its own leaf query.
 * @param props - optional root class name (placement only)
 */
export const CoursesTab = ({
    className,
}: CoursesTabProps) => {
    const t = useTranslations()
    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <LabeledCard
                frameless
                label={t("dashboard.enrolledCourses")}
                icon={<GraduationCapIcon aria-hidden focusable="false" className="size-5" />}
            >
                <MyCoursesProgress />
            </LabeledCard>
            <RecommendedCourses />
            <UpcomingLivestreamCard />
        </div>
    )
}
