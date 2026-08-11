"use client"

import React from "react"
import { cn } from "@heroui/react"
import { MyCoursesProgress } from "./MyCoursesProgress"
import { FeaturedCourses } from "./FeaturedCourses"
import { UpcomingEvents } from "./UpcomingEvents"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CoursesTab}. */
export type CoursesTabProps = WithClassNames<undefined>

/**
 * Dashboard COURSES panel — everything about the viewer's learning path, in the
 * order it is acted on: the enrollments they can resume, then the catalog rail of
 * what they do not own yet, then the events they can still attend.
 *
 * Every child self-fetches its own leaf query and owns its four states through
 * `AsyncContent`; nothing is lifted into a single page-level query.
 *
 * @param props - optional root class name (placement only)
 */
export const CoursesTab = ({ className }: CoursesTabProps) => (
    <div className={cn("flex flex-col gap-6", className)}>
        <MyCoursesProgress />
        <FeaturedCourses />
        <UpcomingEvents />
    </div>
)
