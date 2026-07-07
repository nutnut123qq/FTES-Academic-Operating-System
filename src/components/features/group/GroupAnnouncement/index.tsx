"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryGroupAnnouncementsSwr } from "../hooks/useQueryGroupAnnouncementsSwr"

/** Loading skeleton — mirrors an announcement card (title + time + body). */
const GroupAnnouncementSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1].map((index) => (
            <div
                key={index}
                className="flex flex-col gap-2 rounded-2xl border border-separator p-4"
            >
                <div className="flex items-center justify-between gap-3">
                    <Skeleton.Typography type="body-sm" width="1/2" />
                    <Skeleton.Typography type="body-xs" width="1/4" />
                </div>
                <Skeleton.Typography type="body-sm" width="full" />
                <Skeleton.Typography type="body-sm" width="2/3" />
            </div>
        ))}
    </div>
)

/**
 * Group announcements (§7). DEFAULT on-canon layout: a list of announcement cards
 * (title + body + time). Renders inside the group shell (which owns the container
 * + padding + group header), so this body stays flat like its sibling tabs.
 * ponytail: rows hand-rolled; mock data.
 */
export const GroupAnnouncement = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { announcements, isLoading, error, mutate } = useQueryGroupAnnouncementsSwr(groupId)

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h6" weight="bold">
                {t("announcements.title")}
            </Typography>
            <AsyncContent
                isLoading={isLoading && announcements.length === 0}
                skeleton={<GroupAnnouncementSkeleton />}
                isEmpty={announcements.length === 0}
                emptyContent={{ title: t("announcements.empty") }}
                error={announcements.length === 0 ? error : undefined}
                errorContent={{
                    title: t("announcements.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {announcements.map((announcement) => (
                        <div
                            key={announcement.id}
                            className="flex flex-col gap-2 rounded-2xl border border-separator p-4"
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
            </AsyncContent>
        </div>
    )
}
