"use client"

import React, { useState } from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useQueryReportsSwr } from "../hooks/useQueryReportsSwr"

/**
 * Community moderation queue (§6). DEFAULT on-canon layout: a list of reported
 * items with keep / remove actions. ponytail: rows hand-rolled; actions resolve
 * the row locally (dismiss from the list); mock data.
 */
export const CommunityModeration = () => {
    const t = useTranslations("communityHub")
    const { reports } = useQueryReportsSwr()
    const [resolved, setResolved] = useState<Array<string>>([])

    const pending = reports.filter((report) => !resolved.includes(report.id))
    const resolve = (id: string) => setResolved((prev) => [...prev, id])

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h5" weight="bold">
                {t("moderation.title")}
            </Typography>
            {pending.length === 0 ? (
                <Typography type="body-sm" color="muted">
                    {t("moderation.empty")}
                </Typography>
            ) : (
                pending.map((report) => (
                    <div
                        key={report.id}
                        className="flex flex-col gap-3 rounded-3xl border border-separator p-4"
                    >
                        <div className="flex flex-col gap-0">
                            <Typography type="body-sm" weight="medium">
                                {report.target}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {report.reason} · {t("moderation.reportedBy", { name: report.reporter })}
                            </Typography>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onPress={() => resolve(report.id)}>
                                {t("moderation.keep")}
                            </Button>
                            <Button size="sm" variant="secondary" onPress={() => resolve(report.id)}>
                                {t("moderation.remove")}
                            </Button>
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
