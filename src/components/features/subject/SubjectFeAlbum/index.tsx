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
import { UserLink } from "@/components/features/identity/UserLink"
import { FE_ALBUM_MAX_IMAGES } from "@/components/features/resource/ResourceUpload/uploadRules"
import { useQueryFeAlbumSwr } from "@/components/features/resource/hooks/useQueryFeAlbumSwr"
import { useQueryResourceDetailSwr } from "@/components/features/resource/hooks/useQueryResourceDetailSwr"
import {
    ExamImageViewer,
    type ExamImageViewerImage,
} from "@/components/features/subject/ExamImageViewer"
import { useExamExpand } from "@/components/features/subject/ExamImageViewer/useExamExpand"
import { ALBUM_INITIAL_LOAD, nextAlbumLoadCount } from "./albumLoadWindow"
import { FeAlbumManager } from "./FeAlbumManager"
import { FeImageCommentThread } from "./FeImageCommentThread"

/** Props for {@link SubjectFeAlbum}. Every one is optional: the route renders it bare. */
export interface SubjectFeAlbumProps {
    /** Subject owning the album; falls back to the route param. Only the back link uses it. */
    subjectId?: string
    /** The FE album resource id; falls back to the route param. */
    albumId?: string
    /**
     * Rendered inside a dialog rather than on its own page: the column stops locking itself
     * to the workspace-rail height (it takes the dialog's leftover height and scrolls inside
     * instead), the horizontal header row moves to the top of the comment column, and the
     * "back to practice" button is dropped, since the modal's × already leaves.
     */
    inModal?: boolean
}

/**
 * FE (Final Exam) album viewer — the image-post layout the spec asked for: the picture
 * on the LEFT, that picture's meta + comment thread on the RIGHT.
 *
 * The two-pane anatomy mirrors the community photo lightbox
 * (`CommunityPhotoLightboxModal`): `lg:grid-cols-[minmax(0,1fr)_400px]`, the image
 * letterboxed on black, the right pane on `bg-overlay` shaped like a chat (meta on top,
 * the thread scrolling in the middle, the composer on the bottom edge); on mobile the
 * panes stack and the page scrolls as one. The picture itself is the shared
 * {@link ExamImageViewer} — carets, the `n/total` counter, ←/→ keys, zoom and pan all live
 * there rather than in this page.
 *
 * ON THE ROUTE, from `lg` the PAGE is the height of the workspace rail beside it
 * (`calc(100dvh-4rem)`) and the frame simply takes what is left, rather than naming a
 * height of its own. A frame shorter than the rail is what left the acre of white space
 * under the album, and it shrank the picture for nothing: the scan is `object-contain`,
 * so every pixel the frame gains is a pixel of exam paper.
 *
 * IN A MODAL (`inModal`) that rail number is meaningless — there is no rail. The dialog
 * hosting it names a height of its own (`h-[90vh]`, the community lightbox's number), so
 * the column drops the lock and simply TAKES what is left of the dialog (`flex-1` +
 * `min-h-0`) while owning `overflow-y-auto`: long content (the manager panel open, a long
 * thread) SCROLLS rather than being cut. The header row does not survive there — it moves
 * into the comment column, because a HORIZONTAL header spends its height on both panes at
 * once and the left one is exam paper. The grid's `lg:min-h-[60dvh]` floor stays as the
 * net for the case `flex-1` has nothing definite to resolve against (the manager panel
 * open, or a host that forgot to give the dialog a height).
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
 * The component renders in TWO places — the real route
 * (`/subjects/{id}/practice/fe/{albumId}`) and a modal opened from the practice list —
 * exactly the way `CommunityFeed` reuses `CommunityPostContent`. The route stays the
 * shareable deep link (and keeps the workspace rail's "Practice" highlighted, since its
 * active check is `pathname.startsWith(base/practice)`); the modal does not change the URL.
 * Ids therefore arrive as PROPS, falling back to `useParams()` so the route keeps working
 * without passing anything.
 *
 * The {@link FeAlbumManager} panel (add / delete / reorder pictures) appears only when the
 * SERVER says so: `FeAlbumView.canManage` is computed from the exact predicate the write
 * endpoints guard with (resource owner OR subject approver). Never derive it client-side —
 * a curator's right is granted per SUBJECT while the client only sees GLOBAL leaves, so
 * guessing would both hide the panel from the people who hold the right and offer it to
 * people whose click just 403s. Missing field (older BE) → hidden; it fails closed.
 *
 * @param props - {@link SubjectFeAlbumProps}
 */
export const SubjectFeAlbum = ({
    subjectId: subjectIdProp,
    albumId: albumIdProp,
    inModal = false,
}: SubjectFeAlbumProps) => {
    const t = useTranslations("subjects")
    const locale = useLocale()
    const router = useRouter()
    // ponytail: props first, route params as the fallback — one component, two hosts. The
    // modal has no route params of its own (`useParams()` there answers for whatever page
    // is underneath, or for nothing), so the ids MUST be passable; the fallback is what
    // keeps the deep-link route rendering with no props at all.
    const params = useParams<{ subjectId: string; albumId: string }>()
    const subjectId = subjectIdProp ?? params?.subjectId ?? ""
    const albumId = albumIdProp ?? params?.albumId ?? ""
    const albumSwr = useQueryFeAlbumSwr(albumId)
    const { resource } = useQueryResourceDetailSwr(albumId)
    const [index, setIndex] = useState(0)
    const [isManaging, setIsManaging] = useState(false)
    // Full-screen reading + "hide the comments so the paper gets the whole width". Lives
    // here rather than in the viewer because BOTH of those are this component's layout: the
    // two-pane frame and the comment column are ours, not the viewer's.
    const expand = useExamExpand()

    const images = albumSwr.data?.images ?? []
    const clampedIndex =
        images.length > 0 ? Math.min(Math.max(index, 0), images.length - 1) : 0
    const current = images[clampedIndex]

    /**
     * The album in the shape the shared viewer reads — id, picture, caption and, for a typed
     * page, its Markdown. Nothing more: `commentCount` and `sourceFilename` used to be passed
     * too, for a thumbnail strip the viewer no longer has, so they were handed over for nobody
     * to paint. The comment count still reaches the reader — from the meta strip on the right,
     * for the page actually in front of them.
     */
    const viewerImages = useMemo<Array<ExamImageViewerImage>>(
        () =>
            images.map((image) => ({
                id: image.id,
                imageUrl: image.imageUrl,
                caption: image.caption,
                // Trang chữ và trang scan đi chung một bộ đếm/phân trang — người đọc lật đề không
                // quan tâm trang này vốn là ảnh hay là chữ.
                kind: image.kind,
                textContent: image.textContent,
            })),
        [images],
    )

    // Only fetch the pictures the reader is near. An album is up to 200 scans — pulling every one
    // on mount costs hundreds of megabytes for a page that shows one at a time. What actually
    // keeps that from happening is the viewer itself: it gives a `src` to the page being read and
    // to the ONE it prefetches next, and to nothing else. `loadedCount` (see albumLoadWindow) is
    // the ceiling on that prefetch — it widens ahead of the reader, so ±1 paging never reaches it;
    // it is the guard for an index that could arrive from further away.
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

    // ponytail: ONE header, two places to stand. On the route it is the top row of the page;
    // in the modal it moves to the TOP OF THE COMMENT COLUMN (see below), where its height
    // costs the reader nothing — a row spanning both panes is paid for out of the picture's
    // frame too. Declared once and placed twice rather than duplicated into two branches.
    const headerRow = (
        <div className="flex shrink-0 flex-wrap items-start gap-3">
            {/* On the route this is the way back; in the modal the × is, so a second
                exit that ALSO navigated away would be a trap. */}
            {inModal ? null : (
                <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => router.push(`/subjects/${subjectId}/practice`)}
                >
                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                    {t("practice.fe.backToList")}
                </Button>
            )}
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
                <Button size="sm" variant="secondary" onPress={() => setIsManaging(true)}>
                    <SlidersHorizontalIcon
                        aria-hidden
                        focusable="false"
                        className="size-4"
                    />
                    {t("practice.fe.manage.open")}
                </Button>
            ) : null}
        </div>
    )

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
        //
        // ponytail: in a modal there IS no rail, so the same lock would just make the
        // column taller than the dialog and get it clipped. The dialog names its own
        // `h-[90vh]` instead, so the column takes the remainder (`flex-1`) and carries the
        // scroll — one `cn` branch, no second layout. No padding of its own there either:
        // the dialog's gutter (`.modal__dialog` is forced to 16px app-wide in globals.css)
        // is already the frame, and a second one would only shrink the picture.
        <div
            className={cn(
                "flex flex-col gap-3",
                inModal ? "min-h-0 flex-1 overflow-y-auto" : "p-6",
                !inModal && !isManaging && "lg:h-[calc(100dvh-4rem)]",
            )}
        >
            {inModal ? null : headerRow}

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
                skeleton={<FeAlbumSkeleton inModal={inModal} />}
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
                       case the column is not height-locked (the manager panel is open):
                       in an AUTO row the viewer's `lg:h-full` has no definite height to
                       resolve against and its stage is out of flow, so the pane
                       contributes nothing — the row would take the height of the comment
                       column beside it, and a picture next to a short thread would be a
                       sliver. The modal is permanently in that un-locked case, so its
                       floor is the one that decides how big the scan gets: `60dvh` rather
                       than the bare 26rem minimum. */
                    <div
                        className={
                            // Expanded swaps the frame WHOLE (see useExamExpand): merging an
                            // override onto the docked classes would leave two `lg:grid-cols-*`
                            // utilities fighting, and Tailwind settles that by stylesheet
                            // order, not by which one is written last here.
                            expand.isExpanded
                                ? expand.frameClassName
                                : cn(
                                    "overflow-hidden rounded-2xl border border-separator lg:grid lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-[minmax(0,1fr)]",
                                    inModal ? "lg:min-h-[60dvh]" : "lg:min-h-[26rem]",
                                )
                        }
                    >
                        {/* LEFT — the picture, letterboxed on black. `min-h-0` + an explicitly
                            0-floored row are what let a PORTRAIT scan shrink to the frame
                            instead of inflating it (a grid item's automatic minimum size is
                            its content, and `overflow-hidden` then clips the overflow). */}
                        <ExamImageViewer
                            images={viewerImages}
                            index={clampedIndex}
                            onIndexChange={setIndex}
                            loadedCount={loadedCount}
                            className={
                                expand.isExpanded
                                    ? expand.paneClassName
                                    : "h-[60dvh] min-h-0 lg:h-full"
                            }
                            isExpanded={expand.isExpanded}
                            // No expanding OUT of a dialog: the album in the practice modal is
                            // already covering the page, and a `fixed` overlay inside an
                            // animating dialog resolves against the dialog's own box, not the
                            // viewport. Omitting the handler drops the button rather than
                            // shipping one that half-works.
                            onExpandedChange={inModal ? undefined : expand.setExpanded}
                            areCommentsHidden={expand.areCommentsHidden}
                            onCommentsHiddenChange={expand.setCommentsHidden}
                        />

                        {/* RIGHT — a chat-shaped column: this meta strip on top, the thread
                            filling the rest with its OWN scroll, the composer pinned to the
                            bottom edge (see FeImageCommentThread). It no longer scrolls as a
                            whole, which is what used to let the composer drift up into the
                            empty space under a short thread. */}
                        {/* Hidden only while EXPANDED, and only because the reader asked
                            ("được quyền ẩn cmt để đề full"); useExamExpand puts it back on the
                            way out. `hidden` rather than unmounting: `display:none` already
                            takes it out of the layout AND the accessibility tree, while the
                            thread keeps its page, its scroll and any half-typed comment — an
                            unmount would throw all three away every time the reader wanted a
                            wider look at one question. The column it leaves behind is
                            reclaimed by the frame's `lg:grid-cols-1` (see useExamExpand),
                            which is what actually widens the paper. */}
                        <div
                            className={cn(
                                "flex min-h-0 flex-col gap-3 bg-overlay p-4",
                                !expand.areCommentsVisible && "hidden",
                            )}
                        >
                            {/* The title + "N images in this set" (+ Quản lý) live HERE in
                                the modal — see `headerRow` above. The dialog is a fixed
                                90vh, so every row above the grid is taken straight out of
                                the picture; in this column the same rows cost only comment
                                thread, which scrolls anyway. On the route the header stays
                                on top, where there is a back button to sit beside. */}
                            {inModal ? headerRow : null}

                            {/* The uploader line renders ONLY when the BE actually sent a
                                card. It was removed outright while `FeImageView` carried a
                                bare `uploadedBy` uuid — a label with an empty name beside a
                                generated face reads as "this person has no photo" when the
                                truth was that nothing had been fetched. `fe-album-author-cards`
                                resolves the card BE-side, so the row is back, gated: no card
                                (older backend, or an uploader with no profile) falls through
                                to the timestamp alone rather than to an anonymous placeholder. */}
                            <div className="flex shrink-0 items-center justify-between gap-2">
                                {current.uploader ? (
                                    <div className="flex min-w-0 items-center gap-2">
                                        <UserLink
                                            username={current.uploader.username}
                                            displayName={current.uploader.displayName}
                                            avatar={current.uploader.avatarUrl}
                                            size="sm"
                                            showAvatar
                                            classNames={{ name: "font-semibold" }}
                                        />
                                        <Typography type="body-xs" color="muted">
                                            {formatRelativeTime(current.createdAt, locale)}
                                        </Typography>
                                    </div>
                                ) : (
                                    <Typography type="body-xs" color="muted">
                                        {formatRelativeTime(current.createdAt, locale)}
                                    </Typography>
                                )}
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
                                inModal={inModal}
                            />
                        </div>
                    </div>
                ) : null}
            </AsyncContent>
        </div>
    )
}

/**
 * Loading skeleton — mirrors the two-pane viewer (and its height) so nothing jumps. In the
 * modal the column is not height-locked, so `lg:min-h-0 lg:flex-1` would resolve to ZERO
 * and the skeleton would vanish; it takes the same `60dvh` floor the real frame does there.
 */
const FeAlbumSkeleton = ({ inModal = false }: { inModal?: boolean }) => (
    <div
        className={cn(
            "grid gap-3 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_400px]",
            inModal ? "lg:min-h-[60dvh]" : "lg:min-h-0",
        )}
    >
        <Skeleton className="h-[60dvh] w-full rounded-2xl lg:h-full" />
        <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
    </div>
)
