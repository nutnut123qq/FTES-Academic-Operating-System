"use client"

import React, { useCallback, useState } from "react"
import { Button, Chip, Skeleton, Typography, toast } from "@heroui/react"
import { CaretRightIcon, PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ConfirmDialog } from "@/components/reuseable/PostEngagementBar"
import {
    deleteCollection,
    updateCollection,
    type CollectionResponse,
} from "@/modules/api/rest/resource"
import {
    resolveResourceErrorKey,
    useQueryCollectionsSwr,
    type ResourceCollection,
} from "../hooks/useQueryCollectionsSwr"
import { CollectionDetailModal } from "./CollectionDetailModal"
import { CollectionFormModal } from "./CollectionFormModal"

/** Loading skeleton — mirrors a collection row (title/desc + trailing count chip). */
const CollectionsSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2].map((row) => (
            <div key={row} className="flex items-start gap-3 rounded-2xl border border-separator p-4">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-44 rounded-full" />
                    <Skeleton className="h-3 w-full rounded-full" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
        ))}
    </div>
)

/**
 * Resource collections / learning packs (§5), backed by the real BE
 * (`GET /api/v1/resources/collections/me`). A row opens the collection detail
 * (items + remove + reorder); the header CTA creates a new collection and each row
 * carries rename (`PATCH /collections/{id}`) and delete (`DELETE /collections/{id}`,
 * behind a confirm). Both writes are optimistic and roll back off the FRESH cache.
 * Auth-gated: guests get a sign-in CTA (the endpoint lists the CALLER's own
 * collections) instead of a 401.
 */
export const ResourceCollections = () => {
    const t = useTranslations("resourceHub")
    const { collections, isLoading, error, authenticated, mutate, create } = useQueryCollectionsSwr()
    const { requireAuth, guard } = useRequireAuth()
    const [isCreateOpen, setCreateOpen] = useState(false)
    const [selected, setSelected] = useState<{ id: string; title: string } | null>(null)
    const [editing, setEditing] = useState<ResourceCollection | null>(null)
    const [deleting, setDeleting] = useState<ResourceCollection | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const openCreate = guard(() => setCreateOpen(true), "auth.context.generic")

    /**
     * Renames / re-describes the edited collection. Patches the row optimistically
     * and restores the PREVIOUS values (read back off the fresh cache) when the
     * PATCH fails; rethrows so the form modal keeps the draft and shows the error.
     */
    const onUpdate = useCallback(
        async (input: { title: string; description?: string }): Promise<void> => {
            if (!editing) {
                return
            }
            const id = editing.id
            const title = input.title.trim()
            const description = input.description?.trim() ?? ""
            const previous = { title: editing.title, description: editing.description }

            const patch = async (next: { title: string; description: string }) => {
                await mutate(
                    (current) =>
                        (current ?? []).map((row) =>
                            row.id === id ? { ...row, ...next } : row,
                        ),
                    { revalidate: false },
                )
            }

            await patch({ title, description })
            try {
                await updateCollection(id, { title, description })
            } catch (updateError) {
                await patch(previous)
                void mutate()
                throw updateError
            }
        },
        [editing, mutate],
    )

    /** Deletes the confirmed collection, re-inserting the row when the DELETE fails. */
    const onConfirmDelete = useCallback(async (): Promise<void> => {
        if (!deleting || isDeleting) {
            return
        }
        const id = deleting.id
        setIsDeleting(true)
        let removed: CollectionResponse | undefined
        let removedAt = -1
        await mutate(
            (current) => {
                const rows = current ?? []
                removedAt = rows.findIndex((row) => row.id === id)
                removed = rows[removedAt]
                return rows.filter((row) => row.id !== id)
            },
            { revalidate: false },
        )
        try {
            await deleteCollection(id)
            setDeleting(null)
            // an open detail of the deleted collection would 404 on its next fetch
            setSelected((current) => (current?.id === id ? null : current))
        } catch (deleteError) {
            // rollback: put the row back where it was, off the CURRENT list
            const restored = removed
            const restoredAt = removedAt
            if (restored) {
                await mutate(
                    (current) => {
                        const rows = [...(current ?? [])]
                        rows.splice(
                            restoredAt >= 0 ? Math.min(restoredAt, rows.length) : rows.length,
                            0,
                            restored,
                        )
                        return rows
                    },
                    { revalidate: false },
                )
            }
            void mutate()
            toast.danger(
                `${t("collections.deleteError")} ${t(`apiErrors.${resolveResourceErrorKey(deleteError)}`)}`,
            )
        } finally {
            setIsDeleting(false)
        }
    }, [deleting, isDeleting, mutate, t])

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
            <div className="flex items-center justify-between gap-3">
                <Typography type="h4" weight="bold">
                    {t("collections.title")}
                </Typography>
                <Button variant="primary" size="sm" onPress={() => openCreate()}>
                    <PlusIcon aria-hidden focusable="false" className="size-4" />
                    {t("collections.create")}
                </Button>
            </div>

            <AsyncContent
                isLoading={isLoading && collections.length === 0}
                skeleton={<CollectionsSkeleton />}
                isEmpty={collections.length === 0}
                emptyContent={
                    authenticated
                        ? { title: t("collections.empty") }
                        : {
                              title: t("collections.signInTitle"),
                              onRetry: () => void requireAuth("auth.context.generic"),
                              retryLabel: t("collections.signIn"),
                          }
                }
                error={collections.length === 0 ? error : undefined}
                errorContent={{
                    title: t("collections.loadError"),
                    description: error ? t(`apiErrors.${resolveResourceErrorKey(error)}`) : undefined,
                    onRetry: () => void mutate(),
                    retryLabel: t("hub.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {collections.map((collection) => (
                        <div
                            key={collection.id}
                            className="flex items-start gap-3 rounded-2xl border border-separator p-4 transition-colors hover:bg-default/40"
                        >
                            {/* the row body opens the detail; the actions sit OUTSIDE it
                                (a button inside a button is invalid markup) */}
                            <button
                                type="button"
                                onClick={() =>
                                    setSelected({ id: collection.id, title: collection.title })
                                }
                                className="flex min-w-0 flex-1 items-start gap-3 bg-transparent text-left"
                            >
                                <div className="min-w-0 flex-1">
                                    <Typography type="body-sm" weight="medium" truncate>
                                        {collection.title}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {collection.description}
                                    </Typography>
                                </div>
                                <Chip size="sm" variant="soft" color="accent">
                                    {t("collections.itemsCount", { count: collection.count })}
                                </Chip>
                                <CaretRightIcon
                                    aria-hidden
                                    focusable="false"
                                    className="mt-1 size-4 text-muted"
                                />
                            </button>
                            <Button
                                variant="tertiary"
                                size="sm"
                                isIconOnly
                                aria-label={t("collections.edit")}
                                onPress={() => setEditing(collection)}
                            >
                                <PencilSimpleIcon aria-hidden focusable="false" className="size-4" />
                            </Button>
                            <Button
                                variant="tertiary"
                                size="sm"
                                isIconOnly
                                aria-label={t("collections.delete")}
                                onPress={() => setDeleting(collection)}
                            >
                                <TrashIcon aria-hidden focusable="false" className="size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </AsyncContent>

            <CollectionFormModal
                mode="create"
                isOpen={isCreateOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={create}
            />
            <CollectionFormModal
                mode="edit"
                isOpen={editing !== null}
                initialTitle={editing?.title ?? ""}
                initialDescription={editing?.description ?? ""}
                onClose={() => setEditing(null)}
                onSubmit={onUpdate}
            />
            <ConfirmDialog
                isOpen={deleting !== null}
                title={t("collections.deleteTitle")}
                description={t("collections.deleteDescription", { title: deleting?.title ?? "" })}
                confirmLabel={t("collections.deleteConfirm")}
                isPending={isDeleting}
                onClose={() => {
                    if (!isDeleting) {
                        setDeleting(null)
                    }
                }}
                onConfirm={() => void onConfirmDelete()}
            />
            <CollectionDetailModal
                collectionId={selected?.id ?? null}
                fallbackTitle={selected?.title}
                onClose={() => setSelected(null)}
                // removing/reordering items changes the row's item count → refresh
                onChanged={() => void mutate()}
            />
        </div>
    )
}
