"use client"

import React, { useState } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { FolderIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import {
    useQuerySubjectResourcesSwr,
    type ResourceType,
} from "../hooks/useQuerySubjectResourcesSwr"

/** Filter options: "all" + every resource type. */
const TYPES: Array<ResourceType | "all"> = ["all", "pdf", "slide", "video", "pe", "fe", "source", "notes"]

/**
 * Resources tab (§3 → §5). DEFAULT on-canon layout (no dedicated brainstorm):
 * a type filter row + a dense bordered list of resources + a Collections section.
 * ponytail: rows are bordered lists (house rule: dense lists = rows, not cards);
 * mock data until the BE resource query exists.
 */
export const SubjectResources = () => {
    const t = useTranslations("subjects")
    const { subjectId } = useParams<{ subjectId: string }>()
    const { resources, collections } = useQuerySubjectResourcesSwr(subjectId)
    const [active, setActive] = useState<ResourceType | "all">("all")

    const filtered = active === "all" ? resources : resources.filter((r) => r.type === active)

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* type filter */}
            <div className="flex flex-col gap-3">
                <Typography type="h5" weight="bold">
                    {t("resources.title")}
                </Typography>
                <div className="flex flex-wrap gap-2">
                    {TYPES.map((type) => (
                        <Button
                            key={type}
                            size="sm"
                            variant={active === type ? "secondary" : "ghost"}
                            onPress={() => setActive(type)}
                        >
                            {type === "all" ? t("resources.all") : t(`resources.types.${type}`)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* resource list */}
            <div className="flex flex-col gap-3">
                {filtered.length === 0 ? (
                    <Typography type="body-sm" color="muted">
                        {t("resources.empty")}
                    </Typography>
                ) : (
                    filtered.map((resource) => (
                        <div
                            key={resource.id}
                            className={cn(
                                "flex items-center gap-3 rounded-2xl border border-separator p-4",
                            )}
                        >
                            <div className="min-w-0 flex-1">
                                <Typography type="body-sm" weight="medium" truncate>
                                    {resource.title}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {resource.sizeLabel} · {resource.updatedLabel}
                                </Typography>
                            </div>
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`resources.types.${resource.type}`)}
                            </Chip>
                            <Button size="sm" variant="ghost">
                                {t("resources.download")}
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* collections */}
            <div className="flex flex-col gap-3 border-t border-separator pt-6">
                <Typography type="h6" weight="bold">
                    {t("resources.collections")}
                </Typography>
                {collections.map((collection) => (
                    <div
                        key={collection.id}
                        className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                    >
                        <span className="text-accent">
                            <FolderIcon className="size-5" />
                        </span>
                        <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                            {collection.title}
                        </Typography>
                        <Chip size="sm" variant="soft" color="accent">
                            {t("resources.itemsCount", { count: collection.count })}
                        </Chip>
                    </div>
                ))}
            </div>
        </div>
    )
}
