"use client"

import React from "react"
import {
    LearnBreadcrumb,
} from "@/components/features/learn/shared/LearnBreadcrumb"
import {
    CourseTrustStats,
} from "../CourseTrustStats"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link CourseHero}. */
export type CourseHeroProps = WithClassNames<undefined>

/**
 * Above-the-fold course header, built from the shared {@link PageHeader} block so
 * it matches every other page header (breadcrumb → H3 title → muted description →
 * stat chips). Carries NO price / CTA / cover — those live once in the sticky
 * purchase card (right column). Self-contained (reads the course from redux).
 *
 * @param props - optional className (placement only).
 */
export const CourseHero = ({ className }: CourseHeroProps) => {
    const title = useAppSelector((state) => state.course.entity?.title)
    const description = useAppSelector((state) => state.course.entity?.description)
    const lead = useAppSelector((state) => state.course.entity?.valuePropositions?.[0]?.text)

    return (
        <PageHeader
            className={className}
            breadcrumb={<LearnBreadcrumb />}
            title={title}
            description={lead ?? description}
            meta={<CourseTrustStats />}
        />
    )
}
