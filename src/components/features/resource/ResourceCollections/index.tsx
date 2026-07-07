"use client"

import React from "react"
import { Chip, Skeleton, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { useQueryCollectionsSwr } from "../hooks/useQueryCollectionsSwr"

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
 * Resource collections / learning packs (§5). DEFAULT on-canon layout: a list of
 * collection rows (title + description + item count). ponytail: mock data.
 */
export const ResourceCollections = () => {
    const t = useTranslations("resourceHub")
    const { collections, isLoading, error, mutate } = useQueryCollectionsSwr()

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
            <Typography type="h4" weight="bold">
                {t("collections.title")}
            </Typography>
            <AsyncContent
                isLoading={isLoading && collections.length === 0}
                skeleton={<CollectionsSkeleton />}
                isEmpty={collections.length === 0}
                emptyContent={{ title: t("collections.empty") }}
                error={collections.length === 0 ? error : undefined}
                errorContent={{
                    title: t("collections.loadError"),
                    onRetry: () => void mutate(),
                    retryLabel: t("hub.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {collections.map((collection) => (
                        <div
                            key={collection.id}
                            className="flex items-start gap-3 rounded-2xl border border-separator p-4"
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
                        </div>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
