"use client"

import React from "react"
import type { ReactNode } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { ResponsiveBreadcrumb } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import type { ResponsiveBreadcrumbItem } from "@/components/blocks/navigation/ResponsiveBreadcrumb"
import { pathConfig } from "@/resources/path"
import { useAppSelector } from "@/redux/hooks"

/** Props for {@link LearnBreadcrumb}. */
export interface LearnBreadcrumbProps {
    /**
     * The final (current page) crumb — read-only, no navigation. OMIT on the course-learn home
     * (then `<course>` itself is the last read-only crumb instead of a link).
     */
    current?: ReactNode
    /**
     * Optional intermediate clickable crumb inserted between `<course>` and `current` — for a
     * sub-view of a learn tab (e.g. a flashcard deck under "Ôn tập": the section crumb links back
     * to the tab's overview, `current` is the deck name). Only used when `current` is set.
     */
    section?: {
        /** Section label (e.g. "Ôn tập"). */
        label: ReactNode
        /** Navigate back to the section overview. */
        onPress: () => void
    }
}

/**
 * Shared page breadcrumb for the course-learn tabs: Home › Courses › <course> › [section ›] {current}.
 *
 * Self-contained (reads the active course from Redux + owns its routing), so any learn page can
 * drop it in — render it INSIDE the page's reading column / `PageHeader` `breadcrumb` slot so it
 * shares that column's padding + cap (no separate padded wrapper). Only the last crumb (+ optional
 * section) varies.
 *
 * @param props - {@link LearnBreadcrumbProps}
 */
export const LearnBreadcrumb = ({ current, section }: LearnBreadcrumbProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const course = useAppSelector((state) => state.course.entity)
    const courseDisplayId = useAppSelector((state) => state.course.displayId)

    const items: Array<ResponsiveBreadcrumbItem> = [
        {
            key: "home",
            label: t("nav.home"),
            onPress: () => router.push(pathConfig().locale().build()),
        },
        {
            key: "courses",
            label: t("nav.courses"),
            onPress: () => router.push(pathConfig().locale(locale).course().build()),
        },
        {
            key: "course",
            label: course?.title || t("nav.courses"),
            // clickable only when it's NOT the current (last read-only) crumb
            onPress: current != null
                ? () => router.push(pathConfig().locale(locale).course(courseDisplayId).build())
                : undefined,
        },
        ...(current != null && section
            ? [{ key: "section", label: section.label, onPress: section.onPress }]
            : []),
        ...(current != null ? [{ key: "current", label: current }] : []),
    ]

    return <ResponsiveBreadcrumb items={items} />
}

export default LearnBreadcrumb
