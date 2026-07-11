"use client"

import React from "react"
import { Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryGroupEventsSwr } from "../hooks/useQueryGroupEventsSwr"

/** Loading skeleton — mirrors an event row (title + date/location meta). */
const GroupEventsSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((index) => (
            <div
                key={index}
                className="flex items-center gap-3 rounded-2xl border border-separator p-4"
            >
                <div className="min-w-0 flex-1">
                    <Skeleton.Typography type="body-sm" width="1/2" />
                    <Skeleton.Typography type="body-xs" width="1/3" />
                </div>
            </div>
        ))}
    </div>
)

/**
 * Group events (§7/§14). DEFAULT on-canon layout: a list of upcoming events.
 * Wired to the real group REST API. There is intentionally NO join/RSVP action —
 * the BE tracks no attendance (attendeeCount is always 0).
 */
export const GroupEvents = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { events, isLoading, error, mutate } = useQueryGroupEventsSwr(groupId)

    return (
        <AsyncContent
            isLoading={isLoading && events.length === 0}
            skeleton={<GroupEventsSkeleton />}
            isEmpty={events.length === 0}
            emptyContent={{ title: t("events.empty") }}
            error={events.length === 0 ? error : undefined}
            errorContent={{
                title: t("events.error"),
                onRetry: () => void mutate(),
                retryLabel: t("states.retry"),
            }}
        >
            <div className="flex flex-col gap-3">
                {events.map((event) => (
                    <div
                        key={event.id}
                        className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                    >
                        <div className="min-w-0 flex-1">
                            <Typography type="body-sm" weight="medium" truncate>
                                {event.title}
                            </Typography>
                            <Typography type="body-xs" color="muted">
                                {event.location
                                    ? `${event.dateLabel} · ${event.location}`
                                    : event.dateLabel}
                            </Typography>
                        </div>
                        {/* mock BE - no RSVP: attendeeCount is always 0 and there is no join endpoint. */}
                    </div>
                ))}
            </div>
        </AsyncContent>
    )
}
