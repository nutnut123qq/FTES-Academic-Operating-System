"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, cn } from "@heroui/react"
import {
    ArrowsInIcon,
    ArrowsOutIcon,
    CaretLeftIcon,
    CaretRightIcon,
    ChatCircleIcon,
    ChatCircleSlashIcon,
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
 * Repeating FTES-LOGO watermark drawn over a text page.
 *
 * The tile is a real asset (`public/logo/ftes-watermark-tile.svg`) generated from
 * `public/logo/FTES_black.svg`, so the mark is the BRAND LOGO rather than the word "FTES", and
 * swapping the logo means regenerating one file instead of editing a string in here. Rotation
 * (-24deg) and the padding that gives the spaced-out, burnt-in look are baked into the tile's
 * own viewBox, which is why this can stay a plain repeating background: a CSS background cannot
 * rotate, and an external SVG cannot be referenced from inside a data: URI.
 *
 * Vector, so it stays crisp at any zoom; fill-opacity lives in the asset and is low enough to
 * read straight through — a watermark that fights the text would push curators to screenshot the
 * page instead, which is exactly the behaviour this replaces.
 */
const FTES_WATERMARK = "url(\"/logo/ftes-watermark-tile.svg\")"

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
    /**
     * Full-screen reading mode is ON.
     *
     * The viewer only DRAWS the switch — what expanding actually changes (the two-pane
     * frame becoming the viewport, the comment column disappearing) is the host's layout,
     * so the state lives there. {@link import("./useExamExpand").useExamExpand} is that
     * state, class strings included.
     */
    isExpanded?: boolean
    /**
     * Asked to enter / leave full screen (the toolbar button, or Escape while expanded).
     *
     * OMITTED → no expand control is drawn at all. That is the honest default for a host
     * that has nowhere to expand INTO (a viewer already inside a dialog, a paper embedded
     * in a scrolling column of sections): a button that looks like it should fill the
     * screen and then does nothing is worse than no button.
     */
    onExpandedChange?: (expanded: boolean) => void
    /** The host's comment column is hidden right now. Only meaningful while expanded. */
    areCommentsHidden?: boolean
    /**
     * Asked to hide / show the comment column. Omitted → the toggle is not drawn (a host
     * with no comment column has nothing to hide).
     */
    onCommentsHiddenChange?: (hidden: boolean) => void
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
 * **Paging WRAPS at both ends** — Next on the last page is page 1, Previous on page 1 is
 * the last page — so neither caret is ever disabled. It used to stop dead at the ends; see
 * {@link stepIndex} for why that was wrong. The keys agree with the buttons because both go
 * through the same `goPrev`/`goNext`.
 *
 * **Full screen** is a pair of props, not state: `isExpanded` + `onExpandedChange` draw the
 * expand button and Escape leaves; `areCommentsHidden` + `onCommentsHiddenChange` draw a
 * second switch, expanded only, that hands the comment column's width to the paper. Both
 * pairs are optional and both are drawn ONLY when the host passes a handler, because what
 * expanding actually changes is the host's layout —
 * {@link import("./useExamExpand").useExamExpand} is the ready-made state.
 *
 * **The chrome does not stand on the paper.** Zoom, the `n/total` counter, full screen and
 * the comments switch all live in one bar UNDER the stage, not floating over the page.
 * Floating them was actively costly on a TYPED page, whose white sheet covers the stage
 * edge to edge, so a pill in the top-right corner sat on the exam's own header; and fading
 * a pill does not make what is beneath it readable. Only the two carets stay on the stage,
 * pinned to the extreme edges (where a portrait page leaves letterbox black) and dimmed
 * until hovered or focused.
 *
 * **Paging is signalled three ways**: carets, an `n/total` counter
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
    isExpanded = false,
    onExpandedChange,
    areCommentsHidden = false,
    onCommentsHiddenChange,
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
            const isTyping = Boolean(
                target &&
                    (target.tagName === "INPUT" ||
                        target.tagName === "TEXTAREA" ||
                        target.isContentEditable),
            )
            // Escape is the ONE key that fires even mid-sentence: the full-screen overlay
            // covers the page, so "how do I get out of this" must not depend on where the
            // caret happens to be. (The toolbar button is the other way out, and it is
            // always on screen.) It is also ignored entirely when nothing is expanded, so
            // no other surface's Escape handling changes.
            if (event.key === "Escape") {
                if (isExpanded && onExpandedChange) {
                    event.preventDefault()
                    onExpandedChange(false)
                }
                return
            }
            if (isTyping) {
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
    }, [goPrev, goNext, onZoomIn, onZoomOut, onFit, isExpanded, onExpandedChange])

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
                            {/* ZOOM CHỮ, không phải zoom ảnh (góp ý #11). Thanh zoom nằm ngoài
                                nhánh điều kiện nên nó hiện ở CẢ trang gõ tay, nhưng `scale()`
                                lại chỉ gắn trên `<img>` ở nhánh kia — bấm lên 600% thì con số
                                đổi mà chữ y nguyên, tức là cái nút nói dối. Trang chữ thì
                                phóng to = tăng cỡ chữ (rồi reflow + cuộn), KHÔNG phải phóng
                                một tấm ảnh: `scale()` ở đây sẽ làm chữ tràn ngang phải kéo
                                qua kéo lại mới đọc hết một dòng. `em` để mọi cỡ chữ con
                                (h1/code/chú thích) nở theo cùng một tỉ lệ. */}
                            <article
                                className="relative mx-auto max-w-3xl"
                                style={{ fontSize: `${zoom}em` }}
                            >
                                {/* `math`: một trang đề gõ tay là chỗ DUY NHẤT trên album này
                                    chắc chắn có công thức — `$F(x)=\sqrt{x-3}$` phải ra công
                                    thức, không phải ra đúng chuỗi ký tự đó. Bật theo bề mặt
                                    chứ không bật toàn cục: xem prop `math` của MarkdownContent. */}
                                <MarkdownContent markdown={current.textContent ?? ""} reading math />
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

                {/* Tells the reader the picture is draggable the moment it stops fitting */}
                {!atFit ? (
                    <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                        {t("practice.viewer.panHint")}
                    </div>
                ) : null}

                {hasMultiple ? (
                    <>
                        {/* Neither caret is ever disabled: paging WRAPS (see `stepIndex`), so
                            there is no end to stop at. An inert arrow on the last page was
                            read as the viewer having broken.

                            Sát mép (`left-1`) và MỜ lúc không đụng tới: sau khi thanh công cụ
                            dời xuống thanh chrome, hai caret là thứ DUY NHẤT còn đứng trên
                            tờ giấy — mà một trang đề dựng đứng trong khung ngang thì hai mép
                            là dải đen thừa, đẩy ra đó gần như là đẩy ra khỏi chữ. Mờ chứ
                            không ẩn: nút chỉ hiện khi rê chuột là nút không ai tìm ra, và
                            trên màn cảm ứng thì không có "rê chuột". `focus:opacity-100` giữ
                            đường bàn phím nhìn thấy được khi tab tới. */}
                        <Button
                            isIconOnly
                            variant="ghost"
                            aria-label={t("practice.viewer.previous")}
                            onPress={goPrev}
                            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white opacity-60 transition-opacity hover:bg-black/70 hover:opacity-100 focus:opacity-100"
                        >
                            <CaretLeftIcon aria-hidden focusable="false" className="size-6" />
                        </Button>
                        <Button
                            isIconOnly
                            variant="ghost"
                            aria-label={t("practice.viewer.next")}
                            onPress={goNext}
                            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white opacity-60 transition-opacity hover:bg-black/70 hover:opacity-100 focus:opacity-100"
                        >
                            <CaretRightIcon aria-hidden focusable="false" className="size-6" />
                        </Button>
                    </>
                ) : null}
            </div>

            {/* CHROME BAR — mọi nút điều khiển gom về MỘT hàng NGOÀI sân khấu.
                Trước đây thanh zoom nổi ở `right-3 top-3` và số trang nổi ở đáy, tức là nằm
                ĐÈ lên mặt giấy: với trang gõ tay (tờ giấy trắng `inset-0`, phủ kín sân khấu)
                thì chúng che thẳng vào chữ, và góc trên bên phải lại đúng chỗ đề hay ghi mã
                đề / số trang. Làm mờ đi cũng không đọc được thứ nằm dưới, nên chúng ra hẳn
                ngoài khung giấy. Giá phải trả là ~2.5rem chiều cao của sân khấu — đổi lại
                không còn một pixel đề nào bị che, và bảy nút rải rác ba góc giờ là một cụm
                đọc một lượt. Sân khấu vẫn `flex-1` nên nó tự co lại vừa phần còn dư. */}
            <div className="flex shrink-0 items-center gap-1 border-t border-white/10 px-2 py-1">
                {hasMultiple ? (
                    <span
                        aria-label={t("practice.viewer.counter", {
                            current: clampedIndex + 1,
                            total,
                        })}
                        className="px-2 text-xs font-medium tabular-nums text-white/80"
                    >
                        {clampedIndex + 1}/{total}
                    </span>
                ) : null}
                <div className="ml-auto flex items-center gap-1">
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

                    {/* FULL SCREEN — a different job from the frame-corners button beside it,
                        which zooms the PICTURE back to fit inside whatever frame it has. This
                        one grows the FRAME to the whole viewport (and is why the two carry
                        different icons: `ArrowsOut` is the app's established expand mark, see
                        ContentAiFab). Only drawn when a host said it can host it. */}
                    {onExpandedChange ? (
                        <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            aria-label={t(
                                isExpanded ? "practice.viewer.collapse" : "practice.viewer.expand",
                            )}
                            onPress={() => onExpandedChange(!isExpanded)}
                            className="rounded-full text-white hover:bg-white/20"
                        >
                            {isExpanded ? (
                                <ArrowsInIcon aria-hidden focusable="false" className="size-5" />
                            ) : (
                                <ArrowsOutIcon aria-hidden focusable="false" className="size-5" />
                            )}
                        </Button>
                    ) : null}

                    {/* HIDE THE COMMENTS — expanded only. Docked, the two panes share the page
                        and dropping one would just leave a 400px hole; expanded, giving the
                        paper that column is the entire point ("được quyền ẩn cmt để đề full").
                        Starts SHOWING: hiding the thread is something the reader opts into. */}
                    {isExpanded && onCommentsHiddenChange ? (
                        <Button
                            isIconOnly
                            size="sm"
                            variant="ghost"
                            aria-label={t(
                                areCommentsHidden
                                    ? "practice.viewer.showComments"
                                    : "practice.viewer.hideComments",
                            )}
                            onPress={() => onCommentsHiddenChange(!areCommentsHidden)}
                            className="rounded-full text-white hover:bg-white/20"
                        >
                            {areCommentsHidden ? (
                                <ChatCircleIcon aria-hidden focusable="false" className="size-5" />
                            ) : (
                                <ChatCircleSlashIcon
                                    aria-hidden
                                    focusable="false"
                                    className="size-5"
                                />
                            )}
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
