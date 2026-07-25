"use client"

import React, { useState } from "react"
import { Button, Chip, Typography, toast } from "@heroui/react"
import { FolderIcon, SparkleIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { RestError } from "@/modules/api/rest/client"
import { getResourceDownloadUrl } from "@/modules/api/rest/resource"
import {
    SUBJECT_RESOURCE_TYPES,
    useQuerySubjectResourcesSwr,
    type ResourceType,
    type SubjectResource,
} from "../hooks/useQuerySubjectResourcesSwr"

/** Filter options: "all" + every resource type. */
const TYPES: Array<ResourceType | "all"> = ["all", ...SUBJECT_RESOURCE_TYPES]

/**
 * Builds the `/resources/{id}?ask=1` route the "ask AI about this document" action
 * opens — the resource detail surface reads `ask=1` and opens its AI panel scoped
 * to the document. Exported so the contract is unit-testable.
 *
 * @param resourceId - the real resource UUID.
 */
export const resourceAskAiHref = (resourceId: string) =>
    `/resources/${resourceId}?ask=1`

/**
 * Resources tab (§3 → §5). DEFAULT on-canon layout (no dedicated brainstorm):
 * a type filter row + a dense bordered list of resources + a Collections section.
 * ponytail: rows are bordered lists (house rule: dense lists = rows, not cards).
 *
 * Data is real: the list comes from `GET /resources?subjectId=&type=` (type filter
 * server-side), downloads from `GET /resources/{id}/download-url`, collections from
 * `GET /resources/collections/me`.
 */
export const SubjectResources = () => {
    const t = useTranslations("subjects")
    const locale = useLocale()
    const router = useRouter()
    const { subjectId } = useParams<{ subjectId: string }>()
    const { authenticated, requireAuth, guard } = useRequireAuth()
    const [active, setActive] = useState<ResourceType | "all">("all")
    const { resources, collections, isLoading, error, mutate } =
        useQuerySubjectResourcesSwr(subjectId, active, authenticated)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    /** Human meta line: rating · downloads · created date (each part degrades away). */
    const metaLabel = (resource: SubjectResource) => {
        const parts: Array<string> = []
        if (resource.rating !== null) {
            parts.push(
                t("resources.ratingLabel", {
                    rating: resource.rating.toFixed(1),
                    count: resource.ratingCount,
                }),
            )
        }
        parts.push(t("resources.downloads", { count: resource.downloadCount }))
        if (resource.createdAt) {
            const date = new Date(resource.createdAt)
            if (!Number.isNaN(date.getTime())) {
                parts.push(date.toLocaleDateString(locale))
            }
        }
        return parts.join(" · ")
    }

    /** Opens the presigned download URL; maps the API failure modes to a toast. */
    const onDownload = async (resource: SubjectResource) => {
        setDownloadingId(resource.id)
        try {
            const { url } = await getResourceDownloadUrl(resource.id)
            if (!url) {
                toast.danger(t("resources.downloadError"))
                return
            }
            window.open(url, "_blank", "noopener,noreferrer")
        } catch (downloadError) {
            if (downloadError instanceof RestError) {
                if (downloadError.status === 401) {
                    // session expired mid-action → the sign-in modal, not a toast
                    requireAuth("auth.context.generic")
                    return
                }
                if (downloadError.status === 403) {
                    toast.danger(t("resources.downloadForbidden"))
                    return
                }
                if (downloadError.status === 404) {
                    toast.danger(t("resources.downloadNotFound"))
                    return
                }
                if (downloadError.status === 429) {
                    toast.danger(t("resources.downloadRateLimited"))
                    return
                }
            }
            toast.danger(t("resources.downloadError"))
        } finally {
            setDownloadingId(null)
        }
    }

    /** "Ask AI about this document" — auth-gated (the AI surface needs a session). */
    const onAskAi = guard((resourceId: string) => {
        router.push(resourceAskAiHref(resourceId))
    }, "auth.context.explore")

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* type filter — static chrome, stays outside the skeleton */}
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
            <AsyncContent
                isLoading={isLoading && resources.length === 0}
                skeleton={<ResourceListSkeleton />}
                isEmpty={resources.length === 0}
                emptyContent={{ title: t("resources.empty") }}
                error={resources.length === 0 ? error : undefined}
                errorContent={{
                    title: t("resources.loadError"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("resources.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {resources.map((resource) => (
                        <div
                            key={resource.id}
                            className="flex items-center gap-3 rounded-2xl border border-separator p-4 transition-colors hover:border-accent/50 hover:bg-accent/5"
                        >
                            <div className="min-w-0 flex-1">
                                <Typography type="body-sm" weight="medium" truncate>
                                    {resource.title}
                                </Typography>
                                <Typography type="body-xs" color="muted">
                                    {metaLabel(resource)}
                                </Typography>
                            </div>
                            <Chip size="sm" variant="soft" color="accent">
                                {t(`resources.types.${resource.type}`)}
                            </Chip>
                            <SaveButton entityType="resource" entityId={resource.id} />
                            <Button
                                size="sm"
                                variant="ghost"
                                isIconOnly
                                aria-label={t("resources.askAi")}
                                isDisabled={!resource.isResource}
                                onPress={() => onAskAi(resource.id)}
                            >
                                <SparkleIcon aria-hidden focusable="false" className="size-5" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                isDisabled={!resource.isResource || downloadingId === resource.id}
                                isPending={downloadingId === resource.id}
                                onPress={() => { void onDownload(resource) }}
                            >
                                {t("resources.download")}
                            </Button>
                        </div>
                    ))}
                </div>
            </AsyncContent>

            {/* collections — `GET /resources/collections/me`, scoped to this subject */}
            {collections.length > 0 ? (
                <div className="flex flex-col gap-3 border-t border-separator pt-6">
                    <Typography type="h6" weight="bold">
                        {t("resources.collections")}
                    </Typography>
                    {collections.map((collection) => (
                        <div
                            key={collection.id}
                            className="flex items-center gap-3 rounded-2xl border border-separator p-4"
                        >
                            <FolderIcon aria-hidden focusable="false" className="size-5 shrink-0 text-accent" />
                            <Typography type="body-sm" weight="medium" className="min-w-0 flex-1" truncate>
                                {collection.title}
                            </Typography>
                            <Chip size="sm" variant="soft" color="accent">
                                {t("resources.itemsCount", { count: collection.count })}
                            </Chip>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

/** Loading skeleton — mirrors the resource rows (title/meta text + chip + button). */
const ResourceListSkeleton = () => (
    <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[68px] w-full rounded-2xl" />
        ))}
    </div>
)
