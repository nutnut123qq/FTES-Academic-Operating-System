"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryEnrollSummarySwr } from "../hooks/useQueryEnrollSummarySwr"

/**
 * Course enroll / checkout (§4/§13). DEFAULT on-canon layout: an order summary
 * card + an enroll CTA. ponytail: hand-rolled summary; mock data; CTA is a no-op.
 */
export const CourseEnroll = () => {
    const t = useTranslations("courseSystem")
    const { courseId } = useParams<{ courseId: string }>()
    const { summary } = useQueryEnrollSummarySwr(courseId)

    if (!summary) {
        return null
    }

    const rows: Array<{ key: string; value: string }> = [
        { key: "course", value: `${summary.code} · ${summary.name}` },
        { key: "credits", value: t("enroll.creditsValue", { count: summary.credits }) },
        { key: "price", value: summary.priceLabel },
    ]

    return (
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("enroll.title")}
            </Typography>

            <div className="flex flex-col gap-3 rounded-large border border-separator p-6">
                {rows.map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-3">
                        <Typography type="body-sm" color="muted">
                            {t(`enroll.rows.${row.key}`)}
                        </Typography>
                        <Typography type="body-sm" weight="medium" className="min-w-0 text-right" truncate>
                            {row.value}
                        </Typography>
                    </div>
                ))}
                <Button variant="secondary" className="mt-2" fullWidth>
                    {t("enroll.cta")}
                </Button>
            </div>
        </div>
    )
}
