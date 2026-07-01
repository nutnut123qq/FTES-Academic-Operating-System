"use client"

import { useMemo } from "react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import type { HeadhuntingBreadcrumbItem } from "../types"
import { pathConfig } from "@/resources/path"
import { useAppSelector } from "@/redux/hooks"

/**
 * Builds the breadcrumb trail for the headhunting company detail page.
 * Reads the active course + company from Redux and wires navigation handlers.
 * @returns Ordered breadcrumb rows for the page.
 */
export const useHeadhuntingCompanyBreadcrumbs = (): Array<HeadhuntingBreadcrumbItem> => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const course = useAppSelector((state) => state.course.entity)
    const courseDisplayId = useAppSelector((state) => state.course.displayId)
    const company = useAppSelector((state) => state.headhunter.company)

    /** Href to the headhuntings list; undefined until the course id is known. */
    const headhuntingsListHref = useMemo(() => {
        if (!courseDisplayId) {
            return undefined
        }
        return pathConfig()
            .locale(locale)
            .course(courseDisplayId)
            .learn()
            .headhuntings()
            .build()
    }, [
        courseDisplayId,
        locale,
    ])

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
            onPress: headhuntingsListHref
                ? () => router.push(headhuntingsListHref)
                : undefined,
        },
        {
            key: "company",
            label: company?.title || t("headhuntings.companyDetailTitle"),
        },
    ], [
        company?.title,
        course?.title,
        courseDisplayId,
        headhuntingsListHref,
        locale,
        router,
        t,
    ])
}
