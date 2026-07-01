"use client"

import { useMemo } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type { HeadhuntingBreadcrumbItem } from "../types"
import { pathConfig } from "@/resources/path"
import { useAppSelector } from "@/redux/hooks"

/**
 * Builds the breadcrumb trail for the headhuntings list page.
 * Reads the active course from Redux and wires navigation handlers.
 * @returns Ordered breadcrumb rows for the page.
 */
export const useHeadhuntingsBreadcrumbs = (): Array<HeadhuntingBreadcrumbItem> => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const course = useAppSelector((state) => state.course.entity)
    const courseDisplayId = useAppSelector((state) => state.course.displayId)

    return useMemo((): Array<HeadhuntingBreadcrumbItem> => [
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
            onPress: () => router.push(pathConfig().locale(locale).course(courseDisplayId).build()),
        },
        {
            key: "headhuntings",
            label: t("headhuntings.title"),
        },
    ], [
        course?.title,
        courseDisplayId,
        locale,
        router,
        t,
    ])
}
