"use client"

import React, {
    useMemo,
} from "react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import type {
    FoundationsBreadcrumbItem,
} from "../types"
import {
    FoundationsBreadcrumbs,
} from "../shared/FoundationsBreadcrumbs"
import {
    FoundationMeta,
} from "../shared/FoundationMeta"
import {
    FoundationResourceBody,
} from "../FoundationResourceBody"
import { useAppSelector } from "@/redux/hooks"
import { useQueryFoundationCategoriesSwr } from "@/hooks/swr/api/graphql/queries/useQueryFoundationCategoriesSwr"
import { useQueryFoundationsSwr } from "@/hooks/swr/api/graphql/queries/useQueryFoundationsSwr"
import { pathConfig } from "@/resources/path"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"

/**
 * Dedicated foundation resource page (replaces the old viewer modal).
 *
 * Route `/foundations/[categoryId]/[foundationId]` renders this instead of the
 * list: breadcrumb → H3 header + full {@link FoundationMeta} → the markdown/video
 * body. The active resource is URL-synced into Redux (`UseEffects`); we load the
 * category's resource list here so a cold deep-link can resolve the entity by id.
 * Capped at `max-w-3xl` like every content page. `"use client"` for redux + routing.
 */
export const FoundationResourceLayout = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const course = useAppSelector((state) => state.course.entity)
    const courseDisplayId = useAppSelector((state) => state.course.displayId)
    const category = useAppSelector((state) => state.foundation.category)
    const categoryId = useAppSelector((state) => state.foundation.categoryId)
    const foundation = useAppSelector((state) => state.foundation.entity)

    // load the category title + the resource list so the URL-synced entity resolves on a cold load
    useQueryFoundationCategoriesSwr()
    const { data: foundationsData, isLoading } = useQueryFoundationsSwr()

    /** First load: list still in flight and no resolved entity cached yet. */
    const isFirstLoad = (isLoading && !foundationsData) || !foundation

    /** Breadcrumb: home → courses → course → foundations hub → category → this resource. */
    const breadcrumbItems = useMemo((): Array<FoundationsBreadcrumbItem> => [
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
            key: "foundations-hub",
            label: t("foundations.title"),
            onPress: () => router.push(
                pathConfig().locale(locale).course(courseDisplayId).learn().foundations().build(),
            ),
        },
        {
            key: "category",
            label: category?.title || t("foundations.title"),
            onPress: () => router.push(
                pathConfig().locale(locale).course(courseDisplayId).learn().foundations(categoryId).build(),
            ),
        },
        {
            key: "foundation",
            label: foundation?.title || t("foundations.title"),
        },
    ], [
        category?.title,
        categoryId,
        course?.title,
        courseDisplayId,
        foundation?.title,
        locale,
        router,
        t,
    ])

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
            <FoundationsBreadcrumbs items={breadcrumbItems} />
            <AsyncContent
                isLoading={isFirstLoad}
                isEmpty={!isFirstLoad && !foundation}
                emptyContent={{ title: t("foundations.empty") }}
                skeleton={(
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3">
                            <Skeleton.Typography type="h3" className="w-2/3" />
                            <Skeleton className="h-4 w-full rounded" />
                            <Skeleton className="h-5 w-40 rounded-full" />
                        </div>
                        <Skeleton.Paragraph lines={6} />
                    </div>
                )}
            >
                {foundation ? (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-3">
                            <PageHeader
                                title={foundation.title}
                                description={foundation.description ?? undefined}
                            />
                            <FoundationMeta foundation={foundation} />
                        </div>
                        <FoundationResourceBody foundation={foundation} />
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}
