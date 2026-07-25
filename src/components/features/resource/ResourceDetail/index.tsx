"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button, Chip, Skeleton, Typography, toast } from "@heroui/react"
import { FolderPlusIcon, HeartIcon, ShareNetworkIcon, SparkleIcon } from "@phosphor-icons/react"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { SaveButton } from "@/components/blocks/buttons/SaveButton"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { ErrorContent } from "@/components/blocks/async/ErrorContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { Link } from "@/i18n/navigation"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useGetRelatedResourcesSwr } from "@/hooks/swr/api/rest/queries/useGetRelatedResourcesSwr"
import { RestError } from "@/modules/api/rest/client"
import { favoriteResource, getResourceDownloadUrl, unfavoriteResource } from "@/modules/api/rest/resource"
import { useQueryResourceDetailSwr } from "../hooks/useQueryResourceDetailSwr"
import { ResourceAiQa } from "../ResourceAiQa"
import { AddToCollectionModal } from "./AddToCollectionModal"
import { ResourceComments } from "./ResourceComments"

/** Skeleton mirroring the detail header (title + meta chips + preview box). */
const ResourceDetailSkeleton = () => (
    <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-2/3 rounded-large" />
        <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-32 rounded-full" />
        </div>
        <Skeleton className="h-48 w-full rounded-large" />
    </div>
)

/** Skeleton for the related-resources list. */
const RelatedSkeleton = () => (
    <div className="flex flex-col gap-2">
        {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-10 w-full rounded-large" />
        ))}
    </div>
)

/** `SOURCE_CODE` → `SOURCE CODE` — the BE type enum is not translated. */
const prettyType = (type: string): string => type.replace(/_/g, " ")

/**
 * Resource detail (§5) — wired to the REST backend: `GET /resources/{id}` for the
 * header (title / type / rating), `GET /resources/{id}/related` for the related
 * list, `GET /resources/{id}/download-url` behind the download button and
 * `PUT|DELETE /resources/{id}/favorite` behind the heart (optimistic + rollback).
 *
 * Below the preview sits the flagship AI section ("Hỏi AI về tài liệu này",
 * {@link ResourceAiQa}). It renders for any resource the viewer can READ and that
 * has a current version to ground on — a 404/403 detail or a version-less resource
 * has nothing to answer from, so the section is hidden. `?ask=1` on the URL scrolls
 * to it and focuses the composer (deep link from the hub / a notification).
 */
export const ResourceDetail = () => {
    const t = useTranslations("resourceHub")
    const { resourceId } = useParams<{ resourceId: string }>()
    const { resource, isLoading, error, mutate } = useQueryResourceDetailSwr(resourceId)
    const { guard } = useRequireAuth()

    const relatedSwr = useGetRelatedResourcesSwr(resourceId)
    const related = relatedSwr.data ?? []

    /**
     * Favorite state. The detail payload carries no per-viewer favorite flag, so it
     * starts local-false and is corrected by the toggle response (`{active}`); the
     * day the BE adds it to `ResourceResponse`, hydrate it here.
     */
    const [liked, setLiked] = useState(false)
    const [isTogglingLike, setIsTogglingLike] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    /** "Thêm vào bộ sưu tập" picker — only ever opened for a signed-in viewer. */
    const [isCollectionPickerOpen, setCollectionPickerOpen] = useState(false)

    /** Only ask about a resource that exists AND has a file version to ground on. */
    const canAskAi = !!resource?.currentVersionId

    // deep link `?ask=1` → scroll to the AI section + focus its composer, once.
    // Read from `window.location` (not `useSearchParams`) so this client page needs
    // no Suspense boundary at build time.
    const askFocusedRef = useRef(false)
    useEffect(() => {
        if (!canAskAi || askFocusedRef.current) {
            return
        }
        if (new URLSearchParams(window.location.search).get("ask") !== "1") {
            return
        }
        askFocusedRef.current = true
        document.getElementById("resource-ai-qa")?.scrollIntoView({ behavior: "smooth", block: "start" })
        document.getElementById("resource-ai-qa-input")?.focus({ preventScroll: true })
    }, [canAskAi])

    const onShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href)
            toast.success(t("detail.shareCopied"))
        } catch {
            // clipboard blocked (insecure context / permission) — no-op
        }
    }

    /** Optimistic favorite toggle; rolls back and explains when the call fails. */
    const toggleLike = useCallback(async () => {
        if (isTogglingLike) {
            return
        }
        const next = !liked
        setLiked(next)
        setIsTogglingLike(true)
        try {
            const response = next ? await favoriteResource(resourceId) : await unfavoriteResource(resourceId)
            // trust the server's truth (idempotent re-toggle answers the real state)
            setLiked(typeof response?.active === "boolean" ? response.active : next)
        } catch (favoriteError) {
            setLiked(!next)
            const status = favoriteError instanceof RestError ? favoriteError.status : 0
            toast.danger(status === 403 || status === 404 ? t("detail.likeDenied") : t("detail.likeError"))
        } finally {
            setIsTogglingLike(false)
        }
    }, [isTogglingLike, liked, resourceId, t])

    /** Fetch a presigned URL on demand and hand it to the browser. */
    const onDownload = useCallback(async () => {
        if (isDownloading) {
            return
        }
        setIsDownloading(true)
        try {
            const { url } = await getResourceDownloadUrl(resourceId)
            window.open(url, "_blank", "noopener,noreferrer")
        } catch (downloadError) {
            const status = downloadError instanceof RestError ? downloadError.status : 0
            toast.danger(
                status === 403 || status === 404
                    ? t("detail.downloadDenied")
                    : status === 429
                      ? t("detail.downloadThrottled")
                      : t("detail.downloadError"),
            )
        } finally {
            setIsDownloading(false)
        }
    }, [isDownloading, resourceId, t])

    const onLikePress = guard(() => void toggleLike(), "auth.context.like")
    // the picker lists the CALLER's own collections → guests get the sign-in modal
    const onAddToCollectionPress = guard(() => setCollectionPickerOpen(true), "auth.context.save")

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
            {isLoading && !resource ? (
                <ResourceDetailSkeleton />
            ) : error && !resource ? (
                <ErrorContent
                    title={t("detail.loadError")}
                    onRetry={() => void mutate()}
                    retryLabel={t("hub.retry")}
                />
            ) : resource ? (
                <>
                    <Typography type="h4" weight="bold">
                        {resource.title}
                    </Typography>

                    {/* meta + actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Chip size="sm" variant="soft" color="accent">
                            {prettyType(resource.type)}
                        </Chip>
                        <Typography type="body-xs" color="muted">
                            {resource.ratingCount > 0
                                ? `${t("detail.rating", { rating: (resource.avgRating ?? 0).toFixed(1) })} · ${t("detail.ratingCount", { count: resource.ratingCount })}`
                                : t("detail.noRating")}
                        </Typography>
                        <Button
                            size="sm"
                            variant={liked ? "secondary" : "ghost"}
                            className="ml-auto"
                            isDisabled={isTogglingLike}
                            onPress={onLikePress}
                        >
                            <HeartIcon aria-hidden focusable="false" weight={liked ? "fill" : "regular"} className="size-4" />
                            {t("detail.like")}
                        </Button>
                        <Button size="sm" variant="ghost" onPress={() => void onShare()}>
                            <ShareNetworkIcon aria-hidden focusable="false" className="size-4" />
                            {t("detail.share")}
                        </Button>
                        <SaveButton entityType="resource" entityId={resource.id} />
                        <Button size="sm" variant="ghost" onPress={() => onAddToCollectionPress()}>
                            <FolderPlusIcon aria-hidden focusable="false" className="size-4" />
                            {t("detail.addToCollection")}
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            isPending={isDownloading}
                            isDisabled={!resource.currentVersionId || isDownloading}
                            onPress={() => void onDownload()}
                        >
                            {t("download")}
                        </Button>
                    </div>

                    {/* preview placeholder */}
                    <div className="flex h-48 w-full items-center justify-center rounded-large bg-default/40">
                        <Typography type="body-sm" color="muted">
                            {t("detail.preview")}
                        </Typography>
                    </div>

                    {/* flagship: ask the AI about THIS document (hidden without a version to ground on) */}
                    {canAskAi ? (
                        <div id="resource-ai-qa">
                            <LabeledCard
                                label={t("aiQa.title")}
                                icon={<SparkleIcon aria-hidden focusable="false" className="size-4 text-accent" />}
                            >
                                <ResourceAiQa documentId={resource.id} />
                            </LabeledCard>
                        </div>
                    ) : null}

                    {/* comments (Threads-style discussion; rating lives on /reviews) */}
                    <ResourceComments />

                    {/* related resources — self-hiding when the BE returns nothing */}
                    <LabeledCard label={t("detail.related")} frameless>
                        <AsyncContent
                            isLoading={relatedSwr.isLoading && related.length === 0}
                            skeleton={<RelatedSkeleton />}
                            isEmpty={related.length === 0}
                            emptyContent={{ title: t("detail.relatedEmpty") }}
                            error={related.length === 0 ? relatedSwr.error : undefined}
                            errorContent={{
                                title: t("detail.relatedLoadError"),
                                onRetry: () => void relatedSwr.mutate(),
                                retryLabel: t("hub.retry"),
                            }}
                        >
                            <div className="flex flex-col gap-2">
                                {related.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/resources/${item.id}`}
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-separator p-3 no-underline transition-colors hover:bg-default/40"
                                    >
                                        <Typography type="body-sm" weight="medium" truncate>
                                            {item.title}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" className="shrink-0">
                                            {prettyType(item.type)}
                                        </Typography>
                                    </Link>
                                ))}
                            </div>
                        </AsyncContent>
                    </LabeledCard>

                    <AddToCollectionModal
                        resourceId={resource.id}
                        isOpen={isCollectionPickerOpen}
                        onClose={() => setCollectionPickerOpen(false)}
                    />
                </>
            ) : null}
        </div>
    )
}
