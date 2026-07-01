"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { LearnBreadcrumb } from "../../shared/LearnBreadcrumb"

/**
 * Personal-project breadcrumb (Home › Courses › <course> › Capstone) — the shared
 * {@link LearnBreadcrumb} with the capstone as the current crumb. Rendered inside the route's
 * reading column so it shares that column's single `p-6` (no separate padded wrapper).
 */
export const TaskBreadcrumb = () => {
    const t = useTranslations()
    return <LearnBreadcrumb current={t("course.finalProjectTitle")} />
}

export default TaskBreadcrumb
