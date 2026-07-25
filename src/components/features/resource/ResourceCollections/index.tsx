"use client"

import React, { useState } from "react"
import { Button, Chip, Skeleton, Typography } from "@heroui/react"
import { CaretRightIcon, PlusIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { resolveResourceErrorKey, useQueryCollectionsSwr } from "../hooks/useQueryCollectionsSwr"
import { CollectionDetailModal } from "./CollectionDetailModal"
import { CreateCollectionModal } from "./CreateCollectionModal"

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
 * (items + remove); the header CTA creates a new collection. Auth-gated: guests get
 * a sign-in CTA (the endpoint lists the CALLER's own collections) instead of a 401.
 */
export const ResourceCollections = () => {
    const t = useTranslations("resourceHub")
    const { collections, isLoading, error, authenticated, mutate, create } = useQueryCollectionsSwr()
    const { requireAuth, guard } = useRequireAuth()
    const [isCreateOpen, setCreateOpen] = useState(false)
    const [selected, setSelected] = useState<{ id: string; title: string } | null>(null)

    const openCreate = guard(() => setCreateOpen(true), "auth.context.generic")

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
                        <button
                            key={collection.id}
                            type="button"
                            onClick={() => setSelected({ id: collection.id, title: collection.title })}
                            className="flex w-full items-start gap-3 rounded-2xl border border-separator p-4 text-left transition-colors hover:bg-default/40"
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
                    ))}
                </div>
            </AsyncContent>

            <CreateCollectionModal
                isOpen={isCreateOpen}
                onClose={() => setCreateOpen(false)}
                onCreate={create}
            />
            <CollectionDetailModal
                collectionId={selected?.id ?? null}
                fallbackTitle={selected?.title}
                onClose={() => setSelected(null)}
                // removing an item changes the row's item count → refresh the list
                onChanged={() => void mutate()}
            />
        </div>
    )
}
