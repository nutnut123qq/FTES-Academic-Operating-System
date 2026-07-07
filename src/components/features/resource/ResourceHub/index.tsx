"use client"

import React, { useState } from "react"
import { Button, Chip, Skeleton, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { SearchInput } from "@/components/reuseable/SearchInput"
import {
    useQueryResourceHubSwr,
    type ResourceType,
} from "../hooks/useQueryResourceHubSwr"

/** Filter options: "all" + every resource type. */
const TYPES: Array<ResourceType | "all"> = ["all", "pdf", "slide", "video", "pe", "fe", "source", "notes"]

/** Loading skeleton — mirrors the resource-row anatomy (title/meta + trailing chip). */
const ResourceHubSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-3 rounded-2xl border border-separator px-4 py-3">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-48 rounded-full" />
                    <Skeleton className="h-3 w-32 rounded-full" />
                </div>
                <Skeleton className="h-6 w-14 rounded-full" />
            </div>
        ))}
    </div>
)

/**
 * Global Resource Hub (§5). DEFAULT on-canon layout: a text search + type filter +
 * a dense resource list (mirrors the subject Resources tab, standalone at /resources).
 * ponytail: mock data.
 */
export const ResourceHub = () => {
    const t = useTranslations("resourceHub")
    const { resources, isLoading, error, mutate } = useQueryResourceHubSwr()
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
                <SearchInput
                    value={query}
                    onValueChange={setQuery}
                    placeholder={t("searchPlaceholder")}
                    className="sm:max-w-none"
                />
                {/* quick-narrowing chip bar (mirrors the browse catalog CategoryChipBar idiom) */}
                <div
                    role="tablist"
                    aria-label={t("filterLabel")}
                    className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {TYPES.map((option) => (
                        <button
                            key={option}
                            type="button"
                            role="tab"
                            aria-selected={type === option}
                            onClick={() => setType(option)}
                            className={cn(
                                "flex shrink-0 cursor-pointer items-center rounded-full border px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                                type === option
                                    ? "border-accent bg-accent/10 font-medium text-accent"
                                    : "border-separator text-muted hover:text-foreground",
                            )}
                        >
                            {option === "all" ? t("all") : t(`types.${option}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* resource list */}
            <AsyncContent
                isLoading={isLoading && resources.length === 0}
                skeleton={<ResourceHubSkeleton />}
                isEmpty={filtered.length === 0}
                emptyContent={{ title: t("empty") }}
                error={resources.length === 0 ? error : undefined}
                errorContent={{
                    title: t("hub.loadError"),
                    onRetry: () => void mutate(),
                    retryLabel: t("hub.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {filtered.map((resource) => (
                        <div
                            key={resource.id}
                            className="flex items-center gap-3 rounded-2xl border border-separator px-4 py-3 transition-colors hover:bg-default/40"
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
                            <SaveButton entityType="resource" entityId={resource.id} />
                            <Button size="sm" variant="ghost">
                                {t("download")}
                            </Button>
                        </div>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
