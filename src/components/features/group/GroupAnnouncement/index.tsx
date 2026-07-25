"use client"

import React, { useCallback, useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useAppSelector } from "@/redux/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar"
import { usePostCreateGroupAnnouncementSwr } from "@/hooks/swr/api/rest/mutations/usePostCreateGroupAnnouncementSwr"
import { usePatchGroupAnnouncementSwr } from "@/hooks/swr/api/rest/mutations/usePatchGroupAnnouncementSwr"
import { useDeleteGroupAnnouncementSwr } from "@/hooks/swr/api/rest/mutations/useDeleteGroupAnnouncementSwr"
import { useQueryGroupSwr } from "../hooks/useQueryGroupSwr"
import { AnnouncementForm, type AnnouncementFormValues } from "./AnnouncementForm"
import {
    useGroupAnnouncementRowsSwr,
    type GroupAnnouncementRow,
} from "./useGroupAnnouncementRowsSwr"

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

/** Props for {@link GroupAnnouncementCard}. */
interface GroupAnnouncementCardProps {
    announcement: GroupAnnouncementRow
    /** Owner-only affordances (edit + delete) — mirrors the BE `group.manage` gate. */
    canManage: boolean
    /** Runs the PATCH; resolve `true` to close the inline editor. */
    onUpdate: (id: string, values: AnnouncementFormValues) => Promise<boolean>
    /** Runs the DELETE; resolve `true` to close the confirm dialog. */
    onDelete: (id: string) => Promise<boolean>
}

/** One announcement card; flips into an inline editor for the group owner. */
const GroupAnnouncementCard = ({
    announcement,
    canManage,
    onUpdate,
    onDelete,
}: GroupAnnouncementCardProps) => {
    const t = useTranslations("groupsHub")
    const [isEditing, setIsEditing] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const onSubmit = useCallback(
        async (values: AnnouncementFormValues) => {
            const saved = await onUpdate(announcement.id, values)
            if (saved) {
                setIsEditing(false)
            }
            return saved
        },
        [announcement.id, onUpdate],
    )

    const onConfirmDelete = useCallback(async () => {
        setIsDeleting(true)
        const deleted = await onDelete(announcement.id)
        setIsDeleting(false)
        if (deleted) {
            setIsConfirmOpen(false)
        }
    }, [announcement.id, onDelete])

    if (isEditing) {
        return (
            <AnnouncementForm
                formId={announcement.id}
                initialValues={{
                    title: announcement.title,
                    content: announcement.body,
                    pinned: announcement.pinned,
                }}
                submitLabel={t("announcements.save")}
                onSubmit={onSubmit}
                onCancel={() => setIsEditing(false)}
            />
        )
    }

    return (
        <div className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
            <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <Typography type="body-sm" weight="medium" className="min-w-0" truncate>
                        {announcement.title}
                    </Typography>
                    {announcement.pinned ? (
                        <Chip size="sm" variant="soft" color="accent" className="shrink-0">
                            {t("announcements.pinnedBadge")}
                        </Chip>
                    ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    <Typography type="body-xs" color="muted">
                        {announcement.timeLabel}
                    </Typography>
                    {canManage ? (
                        <>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                aria-label={t("announcements.edit")}
                                onPress={() => setIsEditing(true)}
                            >
                                <PencilSimpleIcon className="size-4" />
                            </Button>
                            <Button
                                isIconOnly
                                size="sm"
                                variant="ghost"
                                aria-label={t("announcements.delete")}
                                onPress={() => setIsConfirmOpen(true)}
                            >
                                <TrashIcon className="size-4" />
                            </Button>
                        </>
                    ) : null}
                </div>
            </div>
            <Typography type="body-sm" color="muted">
                {announcement.body}
            </Typography>
            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => void onConfirmDelete()}
                title={t("announcements.deleteConfirmTitle")}
                description={t("announcements.deleteConfirmBody")}
                confirmLabel={t("announcements.delete")}
                isPending={isDeleting}
            />
        </div>
    )
}

/**
 * Group announcements (§7). A list of announcement cards (title + body + time,
 * pinned first) wired to `/groups/{id}/announcements`.
 *
 * Writing is OWNER-GATED the same way the feed's pin affordance is
 * (`group.ownerId === currentUserId`): only the owner sees the composer and the
 * per-card edit/delete actions, because the BE announcement endpoints are
 * `group.manage`-guarded and would only 403 for everyone else.
 */
export const GroupAnnouncement = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { requireAuth } = useRequireAuth()
    const runRest = useRestWithToast()

    const { announcements, isLoading, error, mutate } = useGroupAnnouncementRowsSwr(groupId)
    const { group } = useQueryGroupSwr(groupId)
    const currentUserId = useAppSelector((state) => state.user.user?.id)
    // announcement writes are `group.manage` — only the owner gets the affordances
    const canManage = group != null && currentUserId != null && group.ownerId === currentUserId

    const [isComposing, setIsComposing] = useState(false)
    const { trigger: triggerCreate } = usePostCreateGroupAnnouncementSwr()
    const { trigger: triggerUpdate } = usePatchGroupAnnouncementSwr()
    const { trigger: triggerDelete } = useDeleteGroupAnnouncementSwr()

    const onCreate = useCallback(
        async (values: AnnouncementFormValues): Promise<boolean> => {
            if (!requireAuth("auth.context.generic")) {
                return false
            }
            const result = await runRest(() => triggerCreate({ id: groupId, request: values }), {
                successMessage: t("announcements.created"),
            })
            if (result === null) {
                return false
            }
            await mutate()
            setIsComposing(false)
            return true
        },
        [groupId, mutate, requireAuth, runRest, t, triggerCreate],
    )

    const onUpdate = useCallback(
        async (announcementId: string, values: AnnouncementFormValues): Promise<boolean> => {
            if (!requireAuth("auth.context.generic")) {
                return false
            }
            const result = await runRest(
                () => triggerUpdate({ id: groupId, announcementId, request: values }),
                { successMessage: t("announcements.updated") },
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
        async (announcementId: string): Promise<boolean> => {
            if (!requireAuth("auth.context.generic")) {
                return false
            }
            const previous = announcements
            // optimistic: the card disappears now and comes back if the write fails
            await mutate(
                previous.filter((announcement) => announcement.id !== announcementId),
                { revalidate: false },
            )
            const result = await runRest(() => triggerDelete({ id: groupId, announcementId }), {
                successMessage: t("announcements.deleted"),
            })
            if (result === null) {
                await mutate(previous, { revalidate: false })
                return false
            }
            await mutate()
            return true
        },
        [announcements, groupId, mutate, requireAuth, runRest, t, triggerDelete],
    )

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h6" weight="bold">
                {t("announcements.title")}
            </Typography>
            {canManage ? (
                isComposing ? (
                    <AnnouncementForm
                        formId="new"
                        submitLabel={t("announcements.post")}
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
                        {t("announcements.create")}
                    </Button>
                )
            ) : null}
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
                        <GroupAnnouncementCard
                            key={announcement.id}
                            announcement={announcement}
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
