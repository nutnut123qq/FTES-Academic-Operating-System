"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useQueryGroupEventsSwr } from "../hooks/useQueryGroupEventsSwr"

/**
 * Group events (§7/§14). DEFAULT on-canon layout: a list of upcoming events with a
 * join action. ponytail: rows hand-rolled; mock data; join is a no-op.
 */
export const GroupEvents = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { events } = useQueryGroupEventsSwr(groupId)

    return (
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
                            {event.dateLabel} · {t("events.attendees", { count: event.attendees })}
                        </Typography>
                    </div>
                    <Button size="sm" variant="secondary">
                        {t("events.join")}
                    </Button>
                </div>
            ))}
        </div>
    )
}
