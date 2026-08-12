"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Button, Chip, Typography } from "@heroui/react"
import { ArrowLeftIcon, ChatCircleIcon, SlidersHorizontalIcon } from "@phosphor-icons/react"
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
import {
    ExamImageViewer,
    type ExamImageViewerImage,
} from "@/components/features/subject/ExamImageViewer"
import { ALBUM_INITIAL_LOAD, nextAlbumLoadCount } from "./albumLoadWindow"
import { FeAlbumManager } from "./FeAlbumManager"
import { FeImageCommentThread } from "./FeImageCommentThread"

/**
 * FE (Final Exam) album viewer — the image-post layout the spec asked for: the picture
 * on the LEFT, the poster's info + that picture's comment thread on the RIGHT.
 *
 * The two-pane anatomy mirrors the community photo lightbox
 * (`CommunityPhotoLightboxModal`): `lg:grid-cols-[minmax(0,1fr)_400px]`, the image
 * letterboxed on black, the right pane on `bg-overlay` scrolling on its own; on mobile the
 * panes stack and the page scrolls as one. The picture itself is the shared
 * {@link ExamImageViewer} — carets, counter, filmstrip, ←/→ keys, zoom and pan all live
 * there rather than in this page.
 *
 * The grid pins its single row to `minmax(0,1fr)` and the viewer carries `min-h-0`: a
 * grid/flex item's automatic minimum size is its CONTENT, so a portrait scan would
 * otherwise refuse to shrink, inflate the row past the frame's fixed height, and get
 * clipped by `overflow-hidden` — the reader seeing one slice of the page with the carets
 * stranded far below the fold.
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

    /** The album in the shape the shared viewer reads (thumbnail badge = comment count). */
    const viewerImages = useMemo<Array<ExamImageViewerImage>>(
        () =>
            images.map((image) => ({
                id: image.id,
                imageUrl: image.imageUrl,
                caption: image.caption,
                badgeCount: image.commentCount,
            })),
        [images],
    )

    // Only fetch the pictures the reader is near. An album is up to 200 scans — pulling every one
    // on mount costs hundreds of megabytes for a page that shows one at a time. `loadedCount` widens
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
                    {/* How many pictures this album HAS — nothing else. It used to read
                        "{count}/{max} ảnh", which every reader parsed as a POSITION ("picture 4
                        of 50") on a 4-picture album. The cap is an author's concern, so it is
                        stated where it can be acted on (the manager's remaining-slots line),
                        never in the reader's header. */}
                    <Typography type="body-sm" color="muted">
                        {t("practice.fe.albumMeta", {
                            count: albumSwr.data?.total ?? images.length,
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
                    /* 20rem of chrome, not 16: this page hangs under the subject workspace
                       shell (4rem navbar + cover banner + identity row), so the old figure
                       pushed the frame's bottom edge — filmstrip included — under the fold. */
                    <div className="overflow-hidden rounded-2xl border border-separator lg:grid lg:h-[calc(100dvh-20rem)] lg:min-h-[26rem] lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[minmax(0,1fr)]">
                        {/* LEFT — the picture, letterboxed on black. `min-h-0` + an explicitly
                            0-floored row are what let a PORTRAIT scan shrink to the frame
                            instead of inflating it (a grid item's automatic minimum size is
                            its content, and `overflow-hidden` then clips the overflow). */}
                        <ExamImageViewer
                            images={viewerImages}
                            index={clampedIndex}
                            onIndexChange={setIndex}
                            loadedCount={loadedCount}
                            className="h-[60dvh] min-h-0 lg:h-full"
                        />

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
        </div>
    )
}

/** Loading skeleton — mirrors the two-pane viewer so the layout never jumps. */
const FeAlbumSkeleton = () => (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="h-[60dvh] w-full rounded-2xl" />
        <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
    </div>
)
