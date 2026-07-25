"use client"

import React, { useCallback, useState } from "react"
import { Button, Typography } from "@heroui/react"
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useAppSelector } from "@/redux/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar"
import { useQueryGroupSwr } from "../hooks/useQueryGroupSwr"
import { useQueryGroupMembersSwr } from "../hooks/useQueryGroupMembersSwr"
import { useMutateAttendGroupEventSwr } from "../hooks/useMutateAttendGroupEventSwr"
import { EventForm, type EventFormValues } from "./EventForm"
import { toIsoInstant } from "./logic"
import { useGroupEventRowsSwr, type GroupEventRow } from "./useGroupEventRowsSwr"
import {
    useDeleteGroupEventSwr,
    usePatchGroupEventSwr,
    usePostCreateGroupEventSwr,
} from "./useMutateGroupEventsSwr"

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

/** Props for {@link GroupEventRowView}. */
interface GroupEventRowViewProps {
    groupId: string
    event: GroupEventRow
    /** Owner/admin affordances (edit + delete). */
    canManage: boolean
    /** Runs the PATCH; resolve `true` to close the inline editor. */
    onUpdate: (eventId: string, values: EventFormValues) => Promise<boolean>
    /** Runs the DELETE; resolve `true` to close the confirm dialog. */
    onDelete: (eventId: string) => Promise<boolean>
}

/** One event row + RSVP toggle (join/leave), optimistic with rollback. */
const GroupEventRowView = ({
    groupId,
    event,
    canManage,
    onUpdate,
    onDelete,
}: GroupEventRowViewProps) => {
    const t = useTranslations("groupsHub")
    const attend = useMutateAttendGroupEventSwr(groupId)
    const [isEditing, setIsEditing] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const meta = event.location ? `${event.dateLabel} · ${event.location}` : event.dateLabel

    const onSubmit = useCallback(
        async (values: EventFormValues) => {
            const saved = await onUpdate(event.id, values)
            if (saved) {
                setIsEditing(false)
            }
            return saved
        },
        [event.id, onUpdate],
    )

    const onConfirmDelete = useCallback(async () => {
        setIsDeleting(true)
        const deleted = await onDelete(event.id)
        setIsDeleting(false)
        if (deleted) {
            setIsConfirmOpen(false)
        }
    }, [event.id, onDelete])

    if (isEditing) {
        return (
            <EventForm
                initialValues={{
                    title: event.title,
                    description: event.description,
                    location: event.location,
                    startsAt: event.startsAt,
                    endsAt: event.endsAt,
                }}
                submitLabel={t("events.save")}
                onSubmit={onSubmit}
                onCancel={() => setIsEditing(false)}
            />
        )
    }

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
            {canManage ? (
                <>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        aria-label={t("events.edit")}
                        onPress={() => setIsEditing(true)}
                    >
                        <PencilSimpleIcon className="size-4" />
                    </Button>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="shrink-0"
                        aria-label={t("events.delete")}
                        onPress={() => setIsConfirmOpen(true)}
                    >
                        <TrashIcon className="size-4" />
                    </Button>
                </>
            ) : null}
            <Button
                size="sm"
                variant={event.attending ? "ghost" : "secondary"}
                className="shrink-0"
                onPress={() => void attend(event.id)}
            >
                {event.attending ? t("events.leave") : t("events.join")}
            </Button>
            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => void onConfirmDelete()}
                title={t("events.deleteConfirmTitle")}
                description={t("events.deleteConfirmBody")}
                confirmLabel={t("events.delete")}
                isPending={isDeleting}
            />
        </div>
    )
}

/**
 * Group events (§7/§14). A list of upcoming events with a live RSVP toggle
 * (join/leave) + real attendee count, plus full owner/admin authoring: a create
 * form (`POST /groups/{id}/events`), inline edit (`PATCH …/{eventId}`) and a
 * confirm-gated delete (`DELETE …/{eventId}`, which also drops the RSVPs).
 *
 * The authoring affordances are gated on the viewer's group role (owner or ADMIN
 * membership) because the write endpoints are moderator-guarded server-side; RSVP
 * itself stays open to every member and is untouched by this wiring.
 */
export const GroupEvents = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { requireAuth } = useRequireAuth()
    const runRest = useRestWithToast()

    const { events, isLoading, error, mutate } = useGroupEventRowsSwr(groupId)
    const { group } = useQueryGroupSwr(groupId)
    const { members } = useQueryGroupMembersSwr(groupId)
    const currentUserId = useAppSelector((state) => state.user.user?.id)
    const isOwner = group != null && currentUserId != null && group.ownerId === currentUserId
    const isAdmin =
        currentUserId != null &&
        members.some(
            (member) =>
                member.id === currentUserId &&
                (member.role === "owner" || member.role === "admin"),
        )
    const canManage = isOwner || isAdmin

    const [isComposing, setIsComposing] = useState(false)
    const { trigger: triggerCreate } = usePostCreateGroupEventSwr()
    const { trigger: triggerUpdate } = usePatchGroupEventSwr()
    const { trigger: triggerDelete } = useDeleteGroupEventSwr()

    const onCreate = useCallback(
        async (values: EventFormValues): Promise<boolean> => {
            if (!requireAuth("auth.context.generic")) {
                return false
            }
            const startsAt = toIsoInstant(values.startsAtLocal)
            if (startsAt === undefined) {
                return false
            }
            const result = await runRest(
                () =>
                    triggerCreate({
                        id: groupId,
                        request: {
                            title: values.title,
                            description: values.description,
                            location: values.location === "" ? undefined : values.location,
                            startsAt,
                            endsAt: toIsoInstant(values.endsAtLocal),
                        },
                    }),
                { successMessage: t("events.created") },
            )
            if (result === null) {
                return false
            }
            // revalidate so the new event lands in the list with its server-truth
            // attendeeCount/attending instead of a hand-built row
            await mutate()
            setIsComposing(false)
            return true
        },
        [groupId, mutate, requireAuth, runRest, t, triggerCreate],
    )

    const onUpdate = useCallback(
        async (eventId: string, values: EventFormValues): Promise<boolean> => {
            if (!requireAuth("auth.context.generic")) {
                return false
            }
            const result = await runRest(
                () =>
                    triggerUpdate({
                        id: groupId,
                        eventId,
                        request: {
                            title: values.title,
                            description: values.description,
                            location: values.location === "" ? undefined : values.location,
                            startsAt: toIsoInstant(values.startsAtLocal),
                            endsAt: toIsoInstant(values.endsAtLocal),
                        },
                    }),
                { successMessage: t("events.updated") },
            )
            if (result === null) {
                return false
            }
            await mutate()
            return true
        },
        [groupId, mutate, requireAuth, runRest, t, triggerUpdate],
    )

    const onDelete = useCallback(
        async (eventId: string): Promise<boolean> => {
            if (!requireAuth("auth.context.generic")) {
                return false
            }
            const previous = events
            // optimistic: the row disappears now and comes back if the write fails
            await mutate(
                previous.filter((event) => event.id !== eventId),
                { revalidate: false },
            )
            const result = await runRest(() => triggerDelete({ id: groupId, eventId }), {
                successMessage: t("events.deleted"),
            })
            if (result === null) {
                await mutate(previous, { revalidate: false })
                return false
            }
            await mutate()
            return true
        },
        [events, groupId, mutate, requireAuth, runRest, t, triggerDelete],
    )

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h6" weight="bold">
                {t("events.title")}
            </Typography>
            {canManage ? (
                isComposing ? (
                    <EventForm
                        submitLabel={t("events.submit")}
                        onSubmit={onCreate}
                        onCancel={() => setIsComposing(false)}
                    />
                ) : (
                    <Button
                        size="sm"
                        variant="secondary"
                        className="self-start"
                        onPress={() => setIsComposing(true)}
                    >
                        {t("events.create")}
                    </Button>
                )
            ) : null}
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
                        <GroupEventRowView
                            key={event.id}
                            groupId={groupId}
                            event={event}
                            canManage={canManage}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
