"use client"

import React, { useState } from "react"
import { Button, Chip, Skeleton, Spinner, Typography, cn, toast } from "@heroui/react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { downloadResourceFile } from "@/modules/api/rest/resource"
import { RestError } from "@/modules/api/rest/client"
import {
    RESOURCE_HUB_TYPES,
    useQueryResourceHubSwr,
    type ResourceType,
} from "../hooks/useQueryResourceHubSwr"

/** Filter options: "all" + every backend-filterable resource type. */
const TYPES: Array<ResourceType | "all"> = ["all", ...RESOURCE_HUB_TYPES]

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
 * Global Resource Hub (§5): text search + type filter + a dense resource list,
 * served by `GET /api/v1/resources` (search/type are SERVER filters — they ride
 * the SWR key, see `useQueryResourceHubSwr`).
 *
 * A row is a link to `/resources/{id}`; the trailing save/download controls
 * swallow their own presses so they never navigate. "Download" resolves the
 * presigned URL through `GET /resources/{id}/download-url` and opens it in a new
 * tab — a 401 re-opens the sign-in modal, 403/404/429 surface a specific toast.
 */
export const ResourceHub = () => {
    const t = useTranslations("resourceHub")
    const { requireAuth } = useRequireAuth()
    const [query, setQuery] = useState("")
    const [type, setType] = useState<ResourceType | "all">("all")
    const { resources, isLoading, error, mutate } = useQueryResourceHubSwr({ q: query, type })
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    /** Resolve the presigned URL for one row and open it; map API failures to copy. */
    const onDownload = async (resourceId: string) => {
        if (downloadingId) {
            return
        }
        setDownloadingId(resourceId)
        try {
            // Tải qua BE-stream: URL provider của PDF/slide/zip bị Cloudinary chặn (401).
            await downloadResourceFile(resourceId)
        } catch (downloadError) {
            const status = downloadError instanceof RestError ? downloadError.status : 0
            if (status === 401) {
                // guests/expired sessions: the shared modal, not a dead-end toast
                requireAuth("auth.context.generic")
            } else if (status === 403) {
                toast.danger(t("hub.downloadForbidden"))
            } else if (status === 404) {
                toast.danger(t("hub.downloadNotFound"))
            } else if (status === 429) {
                toast.danger(t("hub.downloadRateLimited"))
            } else {
                toast.danger(t("hub.downloadError"))
            }
        } finally {
            setDownloadingId(null)
        }
    }

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
                isEmpty={resources.length === 0}
                emptyContent={{ title: t("empty") }}
                error={resources.length === 0 ? error : undefined}
                errorContent={{
                    title: t("hub.loadError"),
                    onRetry: () => void mutate(),
                    retryLabel: t("hub.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {resources.map((resource) => (
                        <Link
                            key={resource.id}
                            href={`/resources/${resource.id}`}
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
                            {/* wrapper swallows the press so downloading never follows the row link */}
                            <span
                                className="inline-flex shrink-0"
                                onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                }}
                            >
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    isDisabled={downloadingId !== null}
                                    onPress={() => void onDownload(resource.id)}
                                >
                                    {downloadingId === resource.id ? (
                                        <Spinner color="current" size="sm" />
                                    ) : null}
                                    {t("download")}
                                </Button>
                            </span>
                        </Link>
                    ))}
                </div>
            </AsyncContent>
        </div>
    )
}
