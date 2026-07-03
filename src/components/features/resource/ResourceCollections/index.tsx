"use client"

import React from "react"
import { Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useQueryCollectionsSwr } from "../hooks/useQueryCollectionsSwr"

/**
 * Resource collections / learning packs (§5). DEFAULT on-canon layout: a list of
 * collection rows (title + description + item count). ponytail: rows hand-rolled;
 * mock data.
 */
export const ResourceCollections = () => {
    const t = useTranslations("resourceHub")
    const { collections } = useQueryCollectionsSwr()

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-6">
            <Typography type="h4" weight="bold">
                {t("collections.title")}
            </Typography>
            {collections.map((collection) => (
                <div
                    key={collection.id}
                    className="flex items-start gap-3 rounded-large border border-separator p-4"
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
    )
}
