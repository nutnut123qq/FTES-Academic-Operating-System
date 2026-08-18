"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, cn } from "@heroui/react"
import {
    CaretLeftIcon,
    CaretRightIcon,
    FrameCornersIcon,
    MagnifyingGlassMinusIcon,
    MagnifyingGlassPlusIcon,
} from "@phosphor-icons/react"
import { useTranslations } from "next-intl"

import { MarkdownContent } from "@/components/reuseable/MarkdownContent"

import {
    FIT_ZOOM,
    MAX_ZOOM,
    NO_OFFSET,
    clampOffset,
    isFitted,
    stepIndex,
    toggleZoom,
    zoomByWheel,
    zoomIn,
    zoomOut,
    type ViewOffset,
    type ViewportMetrics,
} from "./examImageViewport"

/**
 * One page of an exam, in the shape the viewer needs.
 *
 * A page is either a SCAN or TYPED TEXT. Both live in the same album and page with the same
 * carets, because a reader flipping through an exam does not care which one a page happens to be.
 */
export interface ExamImageViewerImage {
    /** Stable id — the React key AND the trigger that resets zoom/pan on a page change. */
    id: string
    /** Absolute, already-signed URL of the picture. `null` on text pages. */
    imageUrl: string | null
    /** Caption, used as the alt text when the uploader wrote one. */
    caption?: string | null
    /**
     * What the page holds. Absent → picture, which is what every album held before text pages
     * existed.
     */
    kind?: "IMAGE" | "TEXT"
    /** The exam as Markdown; text pages only. */
    textContent?: string | null
}

/*
 * Two fields left this shape on 2026-08-17: `badgeCount` (per-page comment count) and
 * `sourceFilename` (a typed page's original filename). Both existed for the thumbnail
 * strip along the bottom edge — the only place either was ever painted — so when the strip
 * went, they became values the album computed and handed over for nobody to read. What the
 * reader sees instead is the album's own comment column (the count for the page in front of
 * them, the only one they can act on) and the `n/total` counter (which tells two typed pages
 * apart just as well as a filename did). The REST field `FeImageView.sourceFilename` stays
 * — that is the BE contract, and unrelated to what this viewer chooses to draw.
 */

/**
 * Repeating "FTES" watermark drawn over a text page, as an inline SVG data URI.
 *
 * SVG rather than a bitmap so it stays crisp at any zoom and costs no network request; `rotate`
 * plus a tile bigger than the glyph gives the diagonal, spaced-out look a burnt-in watermark has.
 * Opacity is low enough to read straight through — a watermark that fights the text would push
 * curators to screenshot the page instead, which is exactly the behaviour this replaces.
 */
const FTES_WATERMARK =
    "url(\"data:image/svg+xml;utf8,"
    + "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='160'>"
    + "<text x='30' y='100' transform='rotate(-24 30 100)' "
    + "font-family='sans-serif' font-size='34' font-weight='700' "
    + "fill='rgb(15 23 42)' fill-opacity='0.06'>FTES</text></svg>\")"

/** A page is text only when it SAYS so — never inferred from a missing url (see below). */
const isTextPage = (page?: ExamImageViewerImage | null): boolean => page?.kind === "TEXT"

/** Props for {@link ExamImageViewer}. */
export interface ExamImageViewerProps {
    /** The pages, in reading order. */
    images: Array<ExamImageViewerImage>
    /** Current page (0-based). Controlled: the caller owns it — its load window depends on it. */
    index: number
    /** Asked to page. The caller clamps/stores; the viewer only ever proposes a valid index. */
    onIndexChange: (index: number) => void
    /**
     * How many pictures the caller is willing to FETCH (its sliding load window). Only the
     * page being read and the PREFETCH of the next one ever hit the network, and the
     * prefetch is skipped past this bound — so a 200-scan album never pulls more than the
     * reader has walked to. Omitted → the whole album is fair game (fine for a one- or
     * two-page paper).
     */
    loadedCount?: number
    /** Extra classes for the pane (the caller owns its height: `h-[55dvh] lg:h-full`). */
    className?: string
}

/**
 * The exam page viewer, shared by both surfaces that show a photographed exam sheet:
 * the FE album (`/subjects/{id}/practice/fe/{albumId}`, an ordered set of scans) and the
 * PE paper of a `pe`-tagged challenge (`/challenges/{id}` → `ChallengePaper`, a SINGLE
 * picture — the challenge contract carries one `paperUrl`, so it passes a one-image array
 * and every paging affordance below drops itself). It stays generic on purpose: it is the
 * one place a paging or zoom fix has to land.
 *
 * **Why the stage is absolutely positioned.** The pane is a flex/grid child of a frame
 * with a fixed height and `overflow-hidden`. A tall portrait scan inside a NORMAL-flow
 * child blows that frame apart: a flex/grid item's `min-height` is `auto`, so it refuses
 * to shrink below its content, while the image's own `max-h-full` resolves against a
 * height that is still indefinite during intrinsic sizing — so it resolves to `none` and
 * the item contributes the scan's full 3000 px. The row grows, the frame clips, and the
 * reader sees a SLICE of the page with the controls stranded a couple of thousand pixels
 * below the fold. Positioning the stage `absolute inset-0` takes it out of flow entirely:
 * it can no longer contribute anything to its ancestors' sizing, `inset-0` gives it a
 * definite box, and `max-h-full` finally means what it says. `min-h-0` on the flex column
 * closes the same door from the other side.
 *
 * **Zoom / pan.** `FIT_ZOOM` (= 1) is fit-to-frame and the floor; ×1.5 per press up to
 * `MAX_ZOOM` (6×) — enough to read the small print on a photographed A4 page. Ctrl/⌘ +
 * wheel (and the trackpad pinch the browser reports as one) zooms about the frame centre;
 * a plain wheel is left alone so the page still scrolls. Past the fit the picture is
 * dragged with the pointer, clamped so an edge can never be pulled inside the frame, and
 * a double-click toggles fit ⇄ 2.5×. Every page change snaps back to the fit — carrying a
 * previous page's pan onto the next scan lands the reader in a blank margin.
 *
 * **Paging is signalled three ways**, all INSIDE the frame: carets, an `n/total` counter
 * and ←/→ keys. There USED to be a fourth — a thumbnail filmstrip along the bottom edge —
 * and it is gone on purpose. Pages of one exam are photographs of near-identical sheets of
 * paper, so at 64 px the thumbnails were interchangeable grey rectangles: they could not
 * answer "which page is this?", which is the only question a strip exists to answer. On an
 * album of any size the strip also overflowed into a horizontal scrollbar of its own, i.e.
 * a second thing to navigate in order to navigate. The counter alone carries the page
 * number, which is what a reader actually goes by.
 *
 * (The strip had earlier been moved from OUTSIDE the frame to inside it, because below a
 * frame taller than the viewport it was invisible and a 50-page album looked like it had
 * no way to reach page 2. That reason retires with the strip: carets and the counter are
 * inside the frame and always in sight.)
 *
 * The `<img>` is deliberately not `next/image`: these URLs come from the storage provider's
 * host, which has no `images.remotePatterns` entry.
 *
 * @param props - {@link ExamImageViewerProps}
 */
export const ExamImageViewer = ({
    images,
    index,
    onIndexChange,
    loadedCount,
    className,
}: ExamImageViewerProps) => {
    const t = useTranslations("subjects")
    const stageRef = useRef<HTMLDivElement | null>(null)
    const imageRef = useRef<HTMLImageElement | null>(null)

    const total = images.length
    const clampedIndex = total > 0 ? Math.min(Math.max(index, 0), total - 1) : 0
    const current = images[clampedIndex]
    const hasMultiple = total > 1
    const loadBound = loadedCount ?? total

    const [zoom, setZoom] = useState(FIT_ZOOM)
    const [offset, setOffset] = useState<ViewOffset>(NO_OFFSET)
    const [isDragging, setIsDragging] = useState(false)
    // The handlers below live in native listeners / pointer callbacks that must read the
    // CURRENT zoom without being re-bound on every step.
    const zoomRef = useRef(FIT_ZOOM)

    /** Frame + fitted-image geometry, read straight off the DOM (transform-free). */
    const readMetrics = useCallback(
        (nextZoom: number): ViewportMetrics => ({
            frameWidth: stageRef.current?.clientWidth ?? 0,
            frameHeight: stageRef.current?.clientHeight ?? 0,
            // `offsetWidth`/`offsetHeight` are LAYOUT sizes: the scale on the element does
            // not distort them, so they stay the fitted size at every zoom.
            contentWidth: imageRef.current?.offsetWidth ?? 0,
            contentHeight: imageRef.current?.offsetHeight ?? 0,
            zoom: nextZoom,
        }),
        [],
    )

    /** Applies a zoom and re-pins the pan to the box the new zoom allows. */
    const applyZoom = useCallback(
        (next: number) => {
            zoomRef.current = next
            setZoom(next)
            setOffset((previous) => clampOffset(previous, readMetrics(next)))
        },
        [readMetrics],
    )

    const onZoomIn = useCallback(() => {
        applyZoom(zoomIn(zoomRef.current))
    }, [applyZoom])

    const onZoomOut = useCallback(() => {
        applyZoom(zoomOut(zoomRef.current))
    }, [applyZoom])

    const onFit = useCallback(() => {
        zoomRef.current = FIT_ZOOM
        setZoom(FIT_ZOOM)
        setOffset(NO_OFFSET)
    }, [])

    const goTo = useCallback(
        (next: number) => {
            if (next !== clampedIndex) {
                onIndexChange(next)
            }
        },
        [clampedIndex, onIndexChange],
    )

    const goPrev = useCallback(() => {
        goTo(stepIndex(clampedIndex, -1, total))
    }, [goTo, clampedIndex, total])

    const goNext = useCallback(() => {
        goTo(stepIndex(clampedIndex, 1, total))
    }, [goTo, clampedIndex, total])

    // A new page starts fitted: a pan inherited from the previous scan would drop the
    // reader into a blank margin of a picture they have not seen yet.
    useEffect(() => {
        zoomRef.current = FIT_ZOOM
        setZoom(FIT_ZOOM)
        setOffset(NO_OFFSET)
    }, [current?.id])

    // Keyboard: ←/→ page, +/-/0 drive the zoom — but never while the reader is typing in
    // the comment composer next door, whose caret owns the arrows.
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
            } else if (event.key === "+" || event.key === "=") {
                onZoomIn()
            } else if (event.key === "-" || event.key === "_") {
                onZoomOut()
            } else if (event.key === "0") {
                onFit()
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [goPrev, goNext, onZoomIn, onZoomOut, onFit])

    // Ctrl/⌘ + wheel zooms; a bare wheel keeps scrolling the page. Registered by hand
    // because React's `onWheel` is passive — `preventDefault()` there is a no-op, and
    // without it the browser would zoom the whole document instead.
    useEffect(() => {
        const stage = stageRef.current
        if (!stage) {
            return
        }
        const onWheel = (event: WheelEvent) => {
            if (!event.ctrlKey && !event.metaKey) {
                return
            }
            event.preventDefault()
            applyZoom(zoomByWheel(zoomRef.current, event.deltaY))
        }
        stage.addEventListener("wheel", onWheel, { passive: false })
        return () => stage.removeEventListener("wheel", onWheel)
    }, [applyZoom])

    // A resize shrinks the pannable box; without this the picture would stay parked
    // outside the new frame.
    useEffect(() => {
        const onResize = () => {
            setOffset((previous) => clampOffset(previous, readMetrics(zoomRef.current)))
        }
        window.addEventListener("resize", onResize)
        return () => window.removeEventListener("resize", onResize)
    }, [readMetrics])

    /** Pointer id + grab origin of the drag in flight. */
    const dragRef = useRef<{
        pointerId: number
        startX: number
        startY: number
        originX: number
        originY: number
    } | null>(null)

    const onPointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (isFitted(zoomRef.current) || event.button !== 0) {
                return
            }
            dragRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                originX: offset.x,
                originY: offset.y,
            }
            event.currentTarget.setPointerCapture(event.pointerId)
            setIsDragging(true)
        },
        [offset],
    )

    const onPointerMove = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            const drag = dragRef.current
            if (!drag || drag.pointerId !== event.pointerId) {
                return
            }
            setOffset(
                clampOffset(
                    {
                        x: drag.originX + (event.clientX - drag.startX),
                        y: drag.originY + (event.clientY - drag.startY),
                    },
                    readMetrics(zoomRef.current),
                ),
            )
        },
        [readMetrics],
    )

    const endDrag = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId !== event.pointerId) {
            return
        }
        dragRef.current = null
        setIsDragging(false)
    }, [])

    const zoomPercent = Math.round(zoom * 100)
    const atFit = isFitted(zoom)
    const atMax = zoom >= MAX_ZOOM - 0.001
    const altText = useMemo(
        () =>
            current?.caption ??
            t("practice.viewer.imageAlt", { index: clampedIndex + 1 }),
        [current?.caption, clampedIndex, t],
    )

    if (!current) {
        return null
    }

    return (
        <div className={cn("relative flex min-h-0 flex-col bg-black", className)}>
            {/* STAGE — everything inside is out of flow, so a 3000px scan cannot inflate it */}
            <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden">
                <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ touchAction: atFit ? "auto" : "none" }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                    onDoubleClick={() => applyZoom(toggleZoom(zoomRef.current))}
                >
                    {isTextPage(current) ? (
                        /* TEXT page: an article, not a picture. No zoom/pan — text reflows, so the
                           whole pinch/drag apparatus would be solving a problem it does not have.
                           Rendered through the house Markdown block so a typed exam looks like every
                           other piece of prose on the site.

                           WHITE sheet, not the theme background: a page of an exam should read like
                           a page of an exam next to the scans it sits beside in the same album —
                           and in dark mode a theme-coloured sheet would put the two kinds of page
                           in visibly different worlds. `text-black` is pinned for the same reason:
                           the sheet is white in both themes, so the ink has to be too.

                           The FTES watermark is a repeating CSS layer. It is BRANDING, not
                           protection — anyone can remove it from devtools and the text still
                           selects and copies cleanly. Burning it in would mean rendering the page
                           to an image, which throws away the searchability, selection and
                           bot-readability this whole feature exists to gain. */
                        <div
                            key={current.id}
                            /* data-theme="light" chứ KHÔNG phải `text-black` trên wrapper: khối
                               Markdown của nhà tự gắn `text-foreground` lên gốc của nó, nên ở dark
                               mode trang đề sẽ là CHỮ TRẮNG TRÊN GIẤY TRẮNG — không đọc được gì, và
                               một wrapper `text-black` bên ngoài không thắng được cái class nằm bên
                               trong. Ghim theme sáng cho tờ giấy làm MỌI token bên trong (chữ, viền,
                               link, khối mã) resolve về bộ sáng, tức đúng thứ một tờ đề in ra giấy
                               phải trông như. */
                            data-theme="light"
                            className="absolute inset-0 overflow-y-auto bg-white px-4 py-6 sm:px-8"
                        >
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 select-none"
                                style={{ backgroundImage: FTES_WATERMARK, backgroundRepeat: "repeat" }}
                            />
                            <article className="relative mx-auto max-w-3xl">
                                <MarkdownContent markdown={current.textContent ?? ""} reading />
                            </article>
                        </div>
                    ) : (
                        /* A plain <img>: the URL is a remote storage host, which next/image
                           would need an explicit remotePatterns entry for. */
                        <img
                            ref={imageRef}
                            key={current.id}
                            src={current.imageUrl ?? undefined}
                            alt={altText}
                            draggable={false}
                            className="max-h-full max-w-full origin-center select-none object-contain"
                            style={{
                                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
                                // No easing mid-drag: the picture must track the pointer 1:1.
                                transition: isDragging ? "none" : "transform 120ms ease-out",
                                cursor: atFit ? "default" : isDragging ? "grabbing" : "grab",
                            }}
                        />
                    )}
                </div>

                {/* Warm the next picture so paging forward is instant. Hidden, and only
                    within the caller's load window, so it costs exactly one file — not the
                    rest of the album. */}
                {clampedIndex + 1 < Math.min(loadBound, total)
                && !isTextPage(images[clampedIndex + 1])
                && images[clampedIndex + 1]?.imageUrl ? (
                        <img
                            src={images[clampedIndex + 1]?.imageUrl ?? undefined}
                            alt=""
                            aria-hidden
                            decoding="async"
                            className="pointer-events-none absolute size-0 opacity-0"
                        />
                    ) : null}

                {/* ZOOM toolbar — top-right, clear of the carets */}
                <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/60 p-1">
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={t("practice.viewer.zoomOut")}
                        isDisabled={atFit}
                        onPress={onZoomOut}
                        className="rounded-full text-white hover:bg-white/20"
                    >
                        <MagnifyingGlassMinusIcon aria-hidden focusable="false" className="size-5" />
                    </Button>
                    <span className="min-w-12 text-center text-xs font-medium tabular-nums text-white">
                        {t("practice.viewer.zoomLevel", { percent: zoomPercent })}
                    </span>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={t("practice.viewer.zoomIn")}
                        isDisabled={atMax}
                        onPress={onZoomIn}
                        className="rounded-full text-white hover:bg-white/20"
                    >
                        <MagnifyingGlassPlusIcon aria-hidden focusable="false" className="size-5" />
                    </Button>
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={t("practice.viewer.fit")}
                        isDisabled={atFit}
                        onPress={onFit}
                        className="rounded-full text-white hover:bg-white/20"
                    >
                        <FrameCornersIcon aria-hidden focusable="false" className="size-5" />
                    </Button>
                </div>

                {/* Tells the reader the picture is draggable the moment it stops fitting */}
                {!atFit ? (
                    <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                        {t("practice.viewer.panHint")}
                    </div>
                ) : null}

                {hasMultiple ? (
                    <>
                        <Button
                            isIconOnly
                            variant="ghost"
                            aria-label={t("practice.viewer.previous")}
                            isDisabled={clampedIndex === 0}
                            onPress={goPrev}
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                        >
                            <CaretLeftIcon aria-hidden focusable="false" className="size-6" />
                        </Button>
                        <Button
                            isIconOnly
                            variant="ghost"
                            aria-label={t("practice.viewer.next")}
                            isDisabled={clampedIndex === total - 1}
                            onPress={goNext}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70"
                        >
                            <CaretRightIcon aria-hidden focusable="false" className="size-6" />
                        </Button>
                        <div
                            aria-label={t("practice.viewer.counter", {
                                current: clampedIndex + 1,
                                total,
                            })}
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white"
                        >
                            {clampedIndex + 1}/{total}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    )
}
