"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import {
    ArrowLeftIcon,
    CaretLeftIcon,
    CaretRightIcon,
    ChatCircleIcon,
    SlidersHorizontalIcon,
} from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"

import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { UserAvatar } from "@/components/reuseable/UserAvatar"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"
import { FE_ALBUM_MAX_IMAGES } from "@/components/features/resource/ResourceUpload/uploadRules"
import { useQueryFeAlbumSwr } from "@/components/features/resource/hooks/useQueryFeAlbumSwr"
import { useQueryResourceDetailSwr } from "@/components/features/resource/hooks/useQueryResourceDetailSwr"
import { ALBUM_INITIAL_LOAD, nextAlbumLoadCount } from "./albumLoadWindow"
import { FeAlbumManager } from "./FeAlbumManager"
import { FeImageCommentThread } from "./FeImageCommentThread"

/**
 * FE (Final Exam) album viewer — the image-post layout the spec asked for: the picture
 * on the LEFT, the poster's info + that picture's comment thread on the RIGHT.
 *
 * The two-pane anatomy mirrors the community photo lightbox
 * (`CommunityPhotoLightboxModal`): `lg:grid-cols-[minmax(0,1fr)_400px]`, the image
 * letterboxed on black with prev/next carets and an `n/total` counter, the right pane on
 * `bg-overlay` scrolling on its own; on mobile the panes stack and the page scrolls as
 * one. ArrowLeft / ArrowRight page the album — but never while the viewer is typing in
 * the composer, whose caret owns those keys.
 *
 * Comments are **per image**: the thread is keyed by the image id, so paging swaps
 * threads instead of bleeding the previous picture's comments into the next one, and the
 * `commentCount` the BE ships per image is shown as a badge.
 *
 * A real route (`/subjects/{id}/practice/fe/{albumId}`) rather than an overlay: an album
 * is shareable, and the workspace rail keeps "Practice" highlighted because its active
 * check is `pathname.startsWith(base/practice)`.
 *
 * The {@link FeAlbumManager} panel (add / delete / reorder pictures) appears only when the
 * SERVER says so: `FeAlbumView.canManage` is computed from the exact predicate the write
 * endpoints guard with (resource owner OR subject approver). Never derive it client-side —
 * a curator's right is granted per SUBJECT while the client only sees GLOBAL leaves, so
 * guessing would both hide the panel from the people who hold the right and offer it to
 * people whose click just 403s. Missing field (older BE) → hidden; it fails closed.
 */
export const SubjectFeAlbum = () => {
    const t = useTranslations("subjects")
    const locale = useLocale()
    const router = useRouter()
    const { subjectId, albumId } = useParams<{ subjectId: string; albumId: string }>()
    const albumSwr = useQueryFeAlbumSwr(albumId)
    const { resource } = useQueryResourceDetailSwr(albumId)
    const [index, setIndex] = useState(0)
    const [isManaging, setIsManaging] = useState(false)

    const images = albumSwr.data?.images ?? []
    const clampedIndex =
        images.length > 0 ? Math.min(Math.max(index, 0), images.length - 1) : 0
    const current = images[clampedIndex]
    const hasMultiple = images.length > 1

    // Only fetch the pictures the reader is near. An album is up to 50 scans — pulling every one
    // on mount costs tens of megabytes for a page that shows one at a time. `loadedCount` widens
    // as they page (see albumLoadWindow); a thumbnail outside it renders WITHOUT a `src`, which is
    // what actually keeps the request from being made.
    const [loadedCount, setLoadedCount] = useState(ALBUM_INITIAL_LOAD)
    useEffect(() => {
        setLoadedCount((loaded) => nextAlbumLoadCount(loaded, clampedIndex, images.length))
    }, [clampedIndex, images.length])
    // A different album starts its own window — otherwise a long album leaves the next one
    // fetching far more than it needs.
    useEffect(() => {
        setLoadedCount(ALBUM_INITIAL_LOAD)
        setIndex(0)
    }, [albumId])

    const goPrev = useCallback(() => {
        setIndex((value) => Math.max(0, value - 1))
    }, [])

    const goNext = useCallback(() => {
        setIndex((value) => Math.min(images.length - 1, value + 1))
    }, [images.length])

    // Arrow keys page the album — but never while the viewer is typing in the comment
    // composer (an editable target keeps its own caret movement).
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null
            if (
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable)
            ) {
                return
            }
            if (event.key === "ArrowLeft") {
                goPrev()
            } else if (event.key === "ArrowRight") {
                goNext()
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [goPrev, goNext])

    return (
        <div className="flex flex-col gap-3 p-6">
            <div className="flex flex-wrap items-start gap-3">
                <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => router.push(`/subjects/${subjectId}/practice`)}
                >
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.fe.backToList")}
                </Button>
                <div className="min-w-0 flex-1">
                    <Typography type="h5" weight="bold" truncate>
                        {resource?.title ?? t("practice.fe.title")}
                    </Typography>
                    <Typography type="body-sm" color="muted">
                        {t("practice.fe.albumMeta", {
                            count: albumSwr.data?.total ?? images.length,
                            max: albumSwr.data?.maxImages ?? images.length,
                        })}
                    </Typography>
                </div>
                {/* Gate on the SERVER's own answer (`canManage` = the very predicate the write
                    endpoints guard with: resource owner OR subject approver). Never derive this
                    from the client permission list: a CTV's approval right is granted per SUBJECT
                    while the client only sees GLOBAL leaves, so guessing hides the controls from
                    exactly the people who may use them. Absent (older BE) → hidden, i.e. fails
                    closed rather than showing a button that 403s. */}
                {albumSwr.data?.canManage === true && !isManaging ? (
                    <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => setIsManaging(true)}
                    >
                        <SlidersHorizontalIcon
                            aria-hidden
                            focusable="false"
                            className="size-4"
                        />
                        {t("practice.fe.manage.open")}
                    </Button>
                ) : null}
            </div>

            {isManaging ? (
                <FeAlbumManager
                    resourceId={albumId}
                    images={images}
                    maxImages={albumSwr.data?.maxImages ?? FE_ALBUM_MAX_IMAGES}
                    onMutated={() => {
                        void albumSwr.mutate()
                    }}
                    onClose={() => setIsManaging(false)}
                />
            ) : null}

            <AsyncContent
                isLoading={!albumSwr.data && !albumSwr.error}
                skeleton={<FeAlbumSkeleton />}
                isEmpty={images.length === 0}
                emptyContent={{ title: t("practice.fe.empty") }}
                error={!albumSwr.data ? albumSwr.error : undefined}
                errorContent={{
                    title: t("practice.fe.loadError"),
                    onRetry: () => {
                        void albumSwr.mutate()
                    },
                    retryLabel: t("practice.exam.retry"),
                }}
            >
                {current ? (
                    <div className="overflow-hidden rounded-2xl border border-separator lg:grid lg:h-[calc(100dvh-16rem)] lg:grid-cols-[minmax(0,1fr)_400px]">
                        {/* LEFT — the picture, letterboxed on black */}
                        <div className="relative flex aspect-video max-h-[50vh] items-center justify-center bg-black lg:aspect-auto lg:h-full lg:max-h-none">
                            {/* A plain <img>: the album URL is a remote storage host, which
                                next/image would need an explicit remotePatterns entry for. */}
                            <img
                                key={current.id}
                                src={current.imageUrl}
                                alt={
                                    current.caption ??
                                    t("practice.fe.imageAlt", { index: clampedIndex + 1 })
                                }
                                className="max-h-full max-w-full object-contain"
                            />
                            {/* Warm the next picture so paging forward is instant. Hidden, and
                                only within the load window, so it costs exactly one file — not
                                the rest of the album. */}
                            {clampedIndex + 1 < Math.min(loadedCount, images.length) ? (
                                <img
                                    src={images[clampedIndex + 1]?.imageUrl}
                                    alt=""
                                    aria-hidden
                                    decoding="async"
                                    className="pointer-events-none absolute size-0 opacity-0"
                                />
                            ) : null}
                            {hasMultiple ? (
                                <>
                                    <Button
                                        isIconOnly
                                        variant="ghost"
                                        aria-label={t("practice.fe.previous")}
                                        isDisabled={clampedIndex === 0}
                                        onPress={goPrev}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                                    >
                                        <CaretLeftIcon
                                            aria-hidden
                                            focusable="false"
                                            className="size-6"
                                        />
                                    </Button>
                                    <Button
                                        isIconOnly
                                        variant="ghost"
                                        aria-label={t("practice.fe.next")}
                                        isDisabled={clampedIndex === images.length - 1}
                                        onPress={goNext}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                                    >
                                        <CaretRightIcon
                                            aria-hidden
                                            focusable="false"
                                            className="size-6"
                                        />
                                    </Button>
                                    <div
                                        aria-label={t("practice.fe.counter", {
                                            current: clampedIndex + 1,
                                            total: images.length,
                                        })}
                                        className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white"
                                    >
                                        {clampedIndex + 1}/{images.length}
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* RIGHT — poster info + THIS picture's comments (scrolls on its own on lg:) */}
                        <div className="flex min-h-0 flex-col gap-3 bg-overlay p-4 lg:overflow-y-auto">
                            <div className="flex items-start gap-3">
                                {/* The album view carries only an uploader id (no profile
                                    join), so the avatar falls back to its neutral tile
                                    rather than inventing a face or printing a uuid. */}
                                <UserAvatar
                                    username={current.uploadedBy}
                                    size="sm"
                                    className="size-9 shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <Typography type="body-sm" weight="medium">
                                        {t("practice.fe.uploader")}
                                    </Typography>
                                    <Typography type="body-xs" color="muted">
                                        {formatRelativeTime(current.createdAt, locale)}
                                    </Typography>
                                </div>
                                <Chip size="sm" variant="soft" color="accent">
                                    <span className="flex items-center gap-1">
                                        <ChatCircleIcon
                                            aria-hidden
                                            focusable="false"
                                            className="size-4"
                                        />
                                        {current.commentCount}
                                    </span>
                                </Chip>
                            </div>

                            {current.caption ? (
                                <Typography type="body-sm">{current.caption}</Typography>
                            ) : null}

                            {/* Keyed by the image: paging resets the thread's page + reply
                                state without an effect, and never shows a stale thread. */}
                            <FeImageCommentThread
                                key={current.id}
                                resourceId={albumId}
                                imageId={current.id}
                            />
                        </div>
                    </div>
                ) : null}
            </AsyncContent>

            {/* Filmstrip — jump straight to a picture, with its comment count */}
            {images.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {images.map((image, position) => (
                        <button
                            key={image.id}
                            type="button"
                            aria-label={t("practice.fe.goToImage", { index: position + 1 })}
                            aria-current={position === clampedIndex}
                            onClick={() => setIndex(position)}
                            className={
                                position === clampedIndex
                                    ? "relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-large border-2 border-accent"
                                    : "relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-large border border-separator opacity-70 transition-opacity hover:opacity-100"
                            }
                        >
                            {/* Outside the load window the thumbnail is an empty box: no `src`
                                means no request, which is the whole point. `loading="lazy"` on
                                its own would not help — the filmstrip scrolls horizontally and
                                the browser happily fetches what is just off-screen. */}
                            {position < loadedCount ? (
                                <img
                                    src={image.imageUrl}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    className="size-full object-cover"
                                />
                            ) : (
                                <span aria-hidden className="block size-full bg-default" />
                            )}
                            {image.commentCount > 0 ? (
                                <span className="absolute bottom-0 right-0 rounded-tl-large bg-black/60 px-1 text-xs font-medium text-white">
                                    {image.commentCount}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

/** Loading skeleton — mirrors the two-pane viewer so the layout never jumps. */
const FeAlbumSkeleton = () => (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
    </div>
)
