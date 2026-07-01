"use client"

import React, { useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import {
    useQueryResourceHubSwr,
    type ResourceType,
} from "../hooks/useQueryResourceHubSwr"

/** Filter options: "all" + every resource type. */
const TYPES: Array<ResourceType | "all"> = ["all", "pdf", "slide", "video", "pe", "fe", "source", "notes"]

/**
 * Global Resource Hub (§5). DEFAULT on-canon layout: a text search + type filter +
 * a dense resource list (mirrors the subject Resources tab, standalone at /resources).
 * ponytail: plain search input + hand-rolled rows; mock data.
 */
export const ResourceHub = () => {
    const t = useTranslations("resourceHub")
    const { resources } = useQueryResourceHubSwr()
    const [query, setQuery] = useState("")
    const [type, setType] = useState<ResourceType | "all">("all")

    const filtered = resources.filter((resource) => {
        const matchesType = type === "all" || resource.type === type
        const matchesQuery =
            query.trim() === "" ||
            `${resource.title} ${resource.subject}`.toLowerCase().includes(query.trim().toLowerCase())
        return matchesType && matchesQuery
    })

    return (
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
            <Typography type="h4" weight="bold">
                {t("title")}
            </Typography>

            {/* search + type filter */}
            <div className="flex flex-col gap-3">
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent"
                />
                <div className="flex flex-wrap gap-2">
                    {TYPES.map((option) => (
                        <Button
                            key={option}
                            size="sm"
                            variant={type === option ? "secondary" : "ghost"}
                            onPress={() => setType(option)}
                        >
                            {option === "all" ? t("all") : t(`types.${option}`)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* resource list */}
            <div className="flex flex-col gap-3">
                {filtered.length === 0 ? (
                    <Typography type="body-sm" color="muted">
                        {t("empty")}
                    </Typography>
                ) : (
                    filtered.map((resource) => (
                        <div
                            key={resource.id}
                            className="flex items-center gap-3 rounded-large border border-separator p-4"
                        >
                            <div className="min-w-0 flex-1">
                                <Typography type="body-sm" weight="medium" truncate>
                                    {resource.title}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {resource.subject} · {resource.sizeLabel}
                                </Typography>
                            </div>
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`types.${resource.type}`)}
                            </Chip>
                            <Button size="sm" variant="ghost">
                                {t("download")}
                            </Button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
