"use client"

import React, {
    useMemo,
} from "react"
import {
    Breadcrumbs,
    Typography,
    cn,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { CVUpload } from "./CVUpload"
import { CVPreview } from "./CVPreview"
import { pathConfig } from "@/resources/path"
import { useQueryCvUrlSwr } from "@/hooks/swr/api/graphql/queries/useQueryCvUrlSwr"

/** One breadcrumb row for the CV page. */
type CvBreadcrumbItem = {
    /** Stable React key. */
    key: string
    /** Visible label. */
    label: string
    /** Optional navigation handler when the segment is clickable. */
    onPress?: () => void
}

/** Props for {@link Cv}. */
export type CvProps = WithClassNames<undefined>

/**
 * CV page — a USER-level (not course-scoped) résumé tool: upload + AI feedback + PDF preview.
 * Hosted at `/profile/cv` (the user owns one CV across all courses). Profile-context breadcrumb
 * (Home › Hồ sơ › CV); the upload/preview blocks self-fetch the user-global CV data.
 *
 * @param props - {@link CvProps}
 */
export const Cv = ({ className }: CvProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    useQueryCvUrlSwr()

    const breadcrumbItems = useMemo((): Array<CvBreadcrumbItem> => [
        {
            key: "home",
            label: t("nav.home"),
            onPress: () => router.push(pathConfig().locale().build()),
        },
        {
            key: "profile",
            label: t("nav.profile"),
            onPress: () => router.push(pathConfig().locale(locale).profile().build()),
        },
        {
            key: "cv",
            label: t("cv.title"),
        },
    ], [
        locale,
        router,
        t,
    ])

    return (
        <div className={cn("mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-6 py-6", className)}>
            <Breadcrumbs>
                {breadcrumbItems.map((item) => (
                    <Breadcrumbs.Item
                        key={item.key}
                        onPress={item.onPress}
                    >
                        {item.label}
                    </Breadcrumbs.Item>
                ))}
            </Breadcrumbs>
            <div className="grid grid-cols-1 items-start lg:grid-cols-5">
                <div className="col-span-3 min-w-0 lg:border-r lg:border-divider/60">
                    <div className="flex flex-col gap-6 p-3">
                        <div className="flex flex-col gap-2">
                            <Typography type="h2" weight="bold">{t("course.cvTitle")}</Typography>
                            <Typography type="body-sm" color="muted">{t("course.cvDescription")}</Typography>
                        </div>
                        <CVUpload />
                    </div>
                </div>
                <CVPreview />
            </div>
        </div>
    )
}
