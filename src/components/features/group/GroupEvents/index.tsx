"use client"

import React from "react"
import { Button, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { useQueryGroupEventsSwr, type GroupEvent } from "../hooks/useQueryGroupEventsSwr"
import { useMutateAttendGroupEventSwr } from "../hooks/useMutateAttendGroupEventSwr"

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

/** One event row + RSVP toggle (join/leave), optimistic with rollback. */
const GroupEventRow = ({ groupId, event }: { groupId: string; event: GroupEvent }) => {
    const t = useTranslations("groupsHub")
    const attend = useMutateAttendGroupEventSwr(groupId)
    const meta = event.location ? `${event.dateLabel} · ${event.location}` : event.dateLabel

    return (
        <div className="flex items-center gap-3 rounded-2xl border border-separator p-4">
            <div className="min-w-0 flex-1">
                <Typography type="body-sm" weight="medium" truncate>
                    {event.title}
                </Typography>
                <Typography type="body-xs" color="muted">
                    {meta ? `${meta} · ` : ""}
                    {t("events.attendees", { count: event.attendeeCount })}
                </Typography>
            </div>
            <Button
                size="sm"
                variant={event.attending ? "ghost" : "secondary"}
                className="shrink-0"
                onPress={() => void attend(event.id)}
            >
                {event.attending ? t("events.leave") : t("events.join")}
            </Button>
        </div>
    )
}

/**
 * Group events (§7/§14). DEFAULT on-canon layout: a list of upcoming events with a
 * live RSVP toggle (join/leave) + real attendee count — change
 * group-identity-media-rules-rsvp.
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
                    <GroupEventRow key={event.id} groupId={groupId} event={event} />
                ))}
            </div>
        </AsyncContent>
    )
}
