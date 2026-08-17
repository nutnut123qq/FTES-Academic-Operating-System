"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Button, Chip, Typography, cn } from "@heroui/react"
import { ArrowLeftIcon, ChatCircleIcon, SlidersHorizontalIcon } from "@phosphor-icons/react"
import { useLocale, useTranslations } from "next-intl"
import { useParams } from "next/navigation"

import { useRouter } from "@/i18n/navigation"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
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
 * on the LEFT, that picture's meta + comment thread on the RIGHT.
 *
 * The two-pane anatomy mirrors the community photo lightbox
 * (`CommunityPhotoLightboxModal`): `lg:grid-cols-[minmax(0,1fr)_400px]`, the image
 * letterboxed on black, the right pane on `bg-overlay` shaped like a chat (meta on top,
 * the thread scrolling in the middle, the composer on the bottom edge); on mobile the
 * panes stack and the page scrolls as one. The picture itself is the shared
 * {@link ExamImageViewer} — carets, counter, filmstrip, ←/→ keys, zoom and pan all live
 * there rather than in this page.
 *
 * From `lg` the PAGE is the height of the workspace rail beside it
 * (`calc(100dvh-4rem)`) and the frame simply takes what is left, rather than naming a
 * height of its own. A frame shorter than the rail is what left the acre of white space
 * under the album, and it shrank the picture for nothing: the scan is `object-contain`,
 * so every pixel the frame gains is a pixel of exam paper.
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
        // ponytail: the page OWNS the height instead of the frame guessing at it. The
        // workspace rail next door is `md:h-[calc(100dvh-4rem)]`, so a shorter content
        // column left that difference as dead white space under the album — and the
        // picture inside a fixed `100dvh-20rem` frame was small for no reason. Matching
        // the rail's own height makes the column end exactly where the rail does (no gap)
        // and hands every spare pixel to the picture, which is `object-contain` and grows
        // with its frame. Only from `lg`: below it the panes STACK, so a capped height
        // would squeeze the comment column instead — the page scrolls there, as before.
        // Dropped while the manager panel is open: that panel is tall and would be the
        // thing squeezed out of a viewport-locked column.
        <div
            className={cn(
                "flex flex-col gap-3 p-6",
                !isManaging && "lg:h-[calc(100dvh-4rem)]",
            )}
        >
            <div className="flex shrink-0 flex-wrap items-start gap-3">
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
                    /* The frame no longer names a height: it TAKES what the column has
                       left (`lg:flex-1`), which is the viewport minus the navbar minus this
                       page's own header row. `lg:min-h-[26rem]` is the floor for the one
                       case the column is not height-locked (the manager panel is open) —
                       without it the auto-height row would collapse onto the filmstrip. */
                    <div className="overflow-hidden rounded-2xl border border-separator lg:grid lg:min-h-[26rem] lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[minmax(0,1fr)]">
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

                        {/* RIGHT — a chat-shaped column: this meta strip on top, the thread
                            filling the rest with its OWN scroll, the composer pinned to the
                            bottom edge (see FeImageCommentThread). It no longer scrolls as a
                            whole, which is what used to let the composer drift up into the
                            empty space under a short thread. */}
                        <div className="flex min-h-0 flex-col gap-3 bg-overlay p-4">
                            {/* ponytail: the "Uploaded by" line is GONE, not fixed — there is
                                nobody to name. `FeImageView` (src/modules/api/rest/resource/types.ts:281)
                                ships `uploadedBy` as a raw uuid and the FE has no
                                name-resolution endpoint to trade it for a display name (the
                                PE paper only names its uploader because the challenge
                                contract sends a resolved `AuthorView`). So the row printed a
                                label with an empty name beside a placeholder avatar. What is
                                left is the meta the BE actually ships: when the picture was
                                posted, and how many comments it carries. */}
                            <div className="flex shrink-0 items-center justify-between gap-2">
                                <Typography type="body-xs" color="muted">
                                    {formatRelativeTime(current.createdAt, locale)}
                                </Typography>
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
                                <Typography type="body-sm" className="shrink-0">
                                    {current.caption}
                                </Typography>
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

/** Loading skeleton — mirrors the two-pane viewer (and its height) so nothing jumps. */
const FeAlbumSkeleton = () => (
    <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
        <Skeleton className="h-[60dvh] w-full rounded-2xl lg:h-full" />
        <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
    </div>
)
