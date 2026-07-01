"use client"

import React from "react"
import {
    useTranslations,
} from "next-intl"
import {
    CourseHero,
} from "./CourseHero"
import {
    CourseValueProps,
} from "./CourseValueProps"
import {
    CourseCurriculum,
} from "./CourseCurriculum"
import {
    CoursePrerequisites,
} from "./CoursePrerequisites"
import {
    CourseFaq,
} from "./CourseFaq"
import {
    CoursePricingRail,
} from "./CoursePricingRail"
import {
    CourseMobileEnrollBar,
} from "./CourseMobileEnrollBar"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryCourseSwr } from "@/hooks/swr/api/graphql/queries/useQueryCourseSwr"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link CourseDetail}. */
export type CourseDetailProps = WithClassNames<undefined>

/**
 * Marketing-first course landing (UI 2.0): a full-width hero (value + social proof
 * + CTA above the fold), then a two-column body — narrative on the left
 * (what-you'll-learn → curriculum → before-you-start → FAQ) and a sticky pricing
 * rail on the right — plus a mobile sticky enroll bar. The whole page is gated on
 * one course fetch; each section reads the hydrated course from redux and hides
 * when its data is empty. Replaces the legacy `layouts/course/Course`.
 *
 * The route param `[courseId]` is synced into `course.displayId` globally by
 * `useSyncReduxCourseId`, which drives {@link useQueryCourseSwr}.
 *
 * @param props - optional className (placement only).
 */
export const CourseDetail = ({ className }: CourseDetailProps) => {
    const t = useTranslations()
    const { isLoading, error, mutate } = useQueryCourseSwr()
    const course = useAppSelector((state) => state.course.entity)

    return (
        <div className={className}>
            <div className="mx-auto w-full max-w-6xl px-6 py-6 pb-24 md:pb-6">
                <AsyncContent
                    isLoading={isLoading && !course}
                    skeleton={(
                        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-10 md:grid-cols-3">
                            <div className="flex flex-col gap-3 md:col-span-2 md:col-start-1 md:row-start-1">
                                <Skeleton.Typography type="h2" />
                                <Skeleton.Typography type="body" />
                                <Skeleton.Metric />
                            </div>
                            <Skeleton.Card className="md:col-span-1 md:col-start-3 md:row-span-2 md:row-start-1" />
                            <Skeleton.Accordion items={3} className="md:col-span-2 md:col-start-1 md:row-start-2" />
                        </div>
                    )}
                    isEmpty={!isLoading && !error && !course}
                    emptyContent={{ title: t("courseLanding.notFound") }}
                    error={error}
                    errorContent={{
                        title: t("courseLanding.errorTitle"),
                        onRetry: () => mutate(),
                        retryLabel: t("courseLanding.retry"),
                    }}
                >
                    {/* ONE grid from the top so the sticky purchase card's top lines up with the
                        breadcrumb/header: header = row 1 (cols 1-2), card = col 3 spanning rows 1-2,
                        narrative = row 2 (cols 1-2). Row gap = 10 (header → content, layouts/gap.md),
                        column gap = 6. DOM order hero → card → narrative → mobile stacks
                        header → purchase card → curriculum. */}
                    <>
                        <div className="grid grid-cols-1 items-start gap-x-6 gap-y-10 md:grid-cols-3">
                            <CourseHero className="md:col-span-2 md:col-start-1 md:row-start-1" />
                            <CoursePricingRail className="md:col-span-1 md:col-start-3 md:row-span-2 md:row-start-1" />
                            <div className="flex flex-col gap-6 md:col-span-2 md:col-start-1 md:row-start-2">
                                <CourseValueProps />
                                <CourseCurriculum />
                                <CoursePrerequisites />
                                <CourseFaq />
                            </div>
                        </div>
                        {/* mobile-only sticky enroll bar (renders only with a loaded course) */}
                        <CourseMobileEnrollBar className="md:hidden" />
                    </>
                </AsyncContent>
            </div>
        </div>
    )
}
