"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryGroupAnnouncementsSwr } from "../hooks/useQueryGroupAnnouncementsSwr"

/**
 * Group announcements (§7). DEFAULT on-canon layout: a list of announcement cards
 * (title + body + time). ponytail: rows hand-rolled; mock data.
 */
export const GroupAnnouncement = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { announcements } = useQueryGroupAnnouncementsSwr(groupId)

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
            <Typography type="h4" weight="bold">
                {t("announcements.title")}
            </Typography>
            {announcements.map((announcement) => (
                <div
                    key={announcement.id}
                    className="flex flex-col gap-1 rounded-large border border-separator p-4"
                >
                    <div className="flex items-center justify-between gap-3">
                        <Typography type="body-sm" weight="medium" className="min-w-0" truncate>
                            {announcement.title}
                        </Typography>
                        <Typography type="body-xs" color="muted" className="shrink-0">
                            {announcement.timeLabel}
                        </Typography>
                    </div>
                    <Typography type="body-sm" color="muted">
                        {announcement.body}
                    </Typography>
                </div>
            ))}
        </div>
    )
}
