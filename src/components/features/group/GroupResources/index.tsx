"use client"

import React, { useCallback, useMemo, useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { ArrowSquareOutIcon, PaperclipIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { useAppSelector } from "@/redux/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar"
import { useGetGroupResourcesSwr } from "@/hooks/swr/api/rest/queries/useGetGroupResourcesSwr"
import { usePutLinkGroupResourceSwr } from "@/hooks/swr/api/rest/mutations/usePutLinkGroupResourceSwr"
import { useDeleteUnlinkGroupResourceSwr } from "@/hooks/swr/api/rest/mutations/useDeleteUnlinkGroupResourceSwr"
import type { GroupResourceLink } from "@/modules/api/rest/group"
import { useQueryGroupSwr } from "../hooks/useQueryGroupSwr"
import { useQueryGroupMembersSwr } from "../hooks/useQueryGroupMembersSwr"
import { extractResourceId } from "./logic"
import { useGroupResourceDetailsSwr, type GroupResourceDetail } from "./useGroupResourceDetailsSwr"

/** Shared field styling — mirrors the hand-rolled inputs in the Discussion composer. */
const FIELD_CLASS =
    "w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"

/** Loading skeleton — mirrors a linked-resource row (title + note + actions). */
const GroupResourcesSkeleton = () => (
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
                <Skeleton.Button width="w-16" className="shrink-0" />
            </div>
        ))}
    </div>
)

/** Props for {@link GroupResourceRow}. */
interface GroupResourceRowProps {
    /** The link record from `GET /groups/{id}/resources`. */
    link: GroupResourceLink
    /** Joined resource detail; `undefined` when it could not be read (403/404). */
    detail?: GroupResourceDetail
    /** Whether the viewer may unlink THIS row (owner, or the member who linked it). */
    canUnlink: boolean
    /** Runs the unlink write; resolves `true` when the row is gone. */
    onUnlink: (resourceId: string) => Promise<boolean>
}

/** One linked resource: title (joined) → resource page, its note, and unlink. */
const GroupResourceRow = ({ link, detail, canUnlink, onUnlink }: GroupResourceRowProps) => {
    const t = useTranslations("groupsHub")
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)

    const title = detail?.title ?? t("resources.untitled", { id: link.resourceId.slice(0, 8) })

    const onConfirm = useCallback(async () => {
        setIsRemoving(true)
        const removed = await onUnlink(link.resourceId)
        setIsRemoving(false)
        if (removed) {
            setIsConfirmOpen(false)
        }
    }, [link.resourceId, onUnlink])

    return (
        <div className="flex items-start gap-3 rounded-2xl border border-separator p-4 transition-colors hover:bg-default/40">
            <PaperclipIcon aria-hidden focusable="false" className="mt-0.5 size-4 shrink-0 text-muted" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex min-w-0 items-center gap-2">
                    <Link
                        href={`/resources/${link.resourceId}`}
                        className="min-w-0 truncate text-sm font-medium text-foreground hover:text-accent"
                        aria-label={t("resources.open")}
                    >
                        {title}
                    </Link>
                    {detail?.type ? (
                        <Chip size="sm" variant="soft" color="accent" className="shrink-0">
                            {detail.type}
                        </Chip>
                    ) : null}
                    <ArrowSquareOutIcon aria-hidden focusable="false" className="size-3 shrink-0 text-muted" />
                </div>
                {link.note ? (
                    <Typography type="body-sm" color="muted">
                        {link.note}
                    </Typography>
                ) : null}
                <Typography type="body-xs" color="muted">
                    {t("resources.addedBy", { name: link.addedBy })}
                </Typography>
            </div>
            {canUnlink ? (
                <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    className="shrink-0"
                    aria-label={t("resources.unlink")}
                    onPress={() => setIsConfirmOpen(true)}
                >
                    <TrashIcon className="size-4" />
                </Button>
            ) : null}
            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={() => void onConfirm()}
                title={t("resources.unlinkConfirmTitle")}
                description={t("resources.unlinkConfirmBody")}
                confirmLabel={t("resources.unlink")}
                isPending={isRemoving}
            />
        </div>
    )
}

/** Props for {@link GroupResourceLinkForm}. */
interface GroupResourceLinkFormProps {
    /** Runs the link write; resolves `true` when the resource was attached. */
    onLink: (resourceId: string, note: string) => Promise<boolean>
}

/** "Attach a document" composer — accepts a pasted resource URL or a bare id + a note. */
const GroupResourceLinkForm = ({ onLink }: GroupResourceLinkFormProps) => {
    const t = useTranslations("groupsHub")
    const [isOpen, setIsOpen] = useState(false)
    const [rawId, setRawId] = useState("")
    const [note, setNote] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const resourceId = extractResourceId(rawId)

    const onSubmit = useCallback(async () => {
        if (resourceId === "" || isSubmitting) {
            return
        }
        setIsSubmitting(true)
        const linked = await onLink(resourceId, note.trim())
        setIsSubmitting(false)
        if (linked) {
            setRawId("")
            setNote("")
            setIsOpen(false)
        }
    }, [isSubmitting, note, onLink, resourceId])

    if (!isOpen) {
        return (
            <Button size="sm" variant="secondary" className="self-start" onPress={() => setIsOpen(true)}>
                {t("resources.link")}
            </Button>
        )
    }

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
            <input
                value={rawId}
                onChange={(event) => setRawId(event.target.value)}
                placeholder={t("resources.idField")}
                aria-label={t("resources.idField")}
                className={FIELD_CLASS}
            />
            <Typography type="body-xs" color="muted">
                {t("resources.idHint")}
            </Typography>
            <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t("resources.noteField")}
                aria-label={t("resources.noteField")}
                className={FIELD_CLASS}
            />
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={resourceId === ""}
                    isPending={isSubmitting}
                    onPress={() => void onSubmit()}
                >
                    {t("resources.submit")}
                </Button>
                <Button size="sm" variant="ghost" onPress={() => setIsOpen(false)}>
                    {t("resources.cancel")}
                </Button>
            </div>
        </div>
    )
}

/**
 * Group Resources tab (§7). Lists the documents linked to a group
 * (`GET /groups/{id}/resources`), hydrating each row's title through the resource
 * hub (`GET /resources/{id}`) so the list reads as titles rather than raw ids —
 * the join is tolerant, a resource the viewer cannot read falls back to its note.
 *
 * Members (and the owner) get an "attach a document" composer that takes either a
 * pasted resource URL or a bare id plus an optional note
 * (`PUT /groups/{id}/resources/{resourceId}`). Unlinking is confirm-gated and
 * optimistic: the row disappears immediately and comes back if the write fails
 * (`DELETE /groups/{id}/resources/{resourceId}`).
 */
export const GroupResources = () => {
    const t = useTranslations("groupsHub")
    const { groupId } = useParams<{ groupId: string }>()
    const { requireAuthAsync } = useRequireAuth()
    const runRest = useRestWithToast()

    const { data, isLoading, error, mutate } = useGetGroupResourcesSwr(groupId)
    const links = useMemo(() => data ?? [], [data])
    const details = useGroupResourceDetailsSwr(links.map((link) => link.resourceId))

    const { group } = useQueryGroupSwr(groupId)
    const { members } = useQueryGroupMembersSwr(groupId)
    const currentUserId = useAppSelector((state) => state.user.user?.id)
    const isOwner = group != null && currentUserId != null && group.ownerId === currentUserId
    const isMember =
        currentUserId != null && members.some((member) => member.id === currentUserId)
    // linking is member-gated server-side — mirror that so guests/outsiders never
    // see an affordance that would only 403
    const canLink = isOwner || isMember

    const { trigger: triggerLink } = usePutLinkGroupResourceSwr()
    const { trigger: triggerUnlink } = useDeleteUnlinkGroupResourceSwr()

    const onLink = useCallback(
        async (resourceId: string, note: string): Promise<boolean> => {
            if (!(await requireAuthAsync("auth.context.generic"))) {
                return false
            }
            const result = await runRest(
                () =>
                    triggerLink({
                        id: groupId,
                        resourceId,
                        request: note === "" ? undefined : { note },
                    }),
                { successMessage: t("resources.linked") },
            )
            if (result === null) {
                return false
            }
            await mutate()
            return true
        },
        [groupId, mutate, requireAuthAsync, runRest, t, triggerLink],
    )

    const onUnlink = useCallback(
        async (resourceId: string): Promise<boolean> => {
            if (!(await requireAuthAsync("auth.context.generic"))) {
                return false
            }
            const previous = links
            // optimistic: drop the row now, restore it if the write fails
            await mutate(
                previous.filter((link) => link.resourceId !== resourceId),
                { revalidate: false },
            )
            const result = await runRest(() => triggerUnlink({ id: groupId, resourceId }), {
                successMessage: t("resources.unlinked"),
            })
            if (result === null) {
                await mutate(previous, { revalidate: false })
                return false
            }
            await mutate()
            return true
        },
        [groupId, links, mutate, requireAuthAsync, runRest, t, triggerUnlink],
    )

    return (
        <div className="flex flex-col gap-3">
            <Typography type="h6" weight="bold">
                {t("resources.title")}
            </Typography>
            {canLink ? <GroupResourceLinkForm onLink={onLink} /> : null}
            <AsyncContent
                isLoading={isLoading && links.length === 0}
                skeleton={<GroupResourcesSkeleton />}
                isEmpty={links.length === 0}
                emptyContent={{ title: t("resources.empty") }}
                error={links.length === 0 ? error : undefined}
                errorContent={{
                    title: t("resources.error"),
                    onRetry: () => void mutate(),
                    retryLabel: t("states.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {links.map((link) => (
                        <GroupResourceRow
                            key={link.resourceId}
                            link={link}
                            detail={details[link.resourceId]}
                            canUnlink={isOwner || link.addedBy === currentUserId}
                            onUnlink={onUnlink}
                        />
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
