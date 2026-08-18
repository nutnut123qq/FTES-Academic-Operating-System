/**
 * Pure viewport maths for {@link ExamImageViewer} — zoom levels, pan bounds, paging.
 *
 * An exam page is a PHOTOGRAPH of A4 paper: 2000–4000 px tall, letterboxed into a frame a
 * few hundred pixels high. Fit-to-frame therefore renders it at roughly a fifth of its
 * pixels, which is unreadable — so "fit" is only ever the starting point and the reader
 * must be able to magnify back up to (and past) the scan's own resolution. Hence
 * {@link FIT_ZOOM} = 1 is the FLOOR (zooming out below the fit shows nothing but black)
 * and {@link MAX_ZOOM} is deliberately generous.
 *
 * The maths lives here, apart from the component, for the usual reason: clamping is where
 * a viewer breaks (an image dragged off into the void, a zoom that runs away on a
 * trackpad) and clamping is exactly what a pure function can be tested on.
 */

/** Zoom at which the whole page fits the frame — `object-contain` at `scale(1)`. */
export const FIT_ZOOM = 1

/**
 * Upper bound. 6× the fitted size puts a 3000 px scan comfortably past 1:1 in a ~600 px
 * frame, which is what "read the small print on the exam" actually needs.
 */
export const MAX_ZOOM = 6

/** Multiplier per press of the +/− buttons (1 → 1.5 → 2.25 → … → 6). */
export const ZOOM_STEP = 1.5

/** Where a double-click / double-tap jumps to from the fit. */
export const DOUBLE_CLICK_ZOOM = 2.5

/**
 * Wheel-to-zoom gain. Applied as `zoom * e^(-deltaY * SENSITIVITY)` so the ratio per
 * notch is constant (a step near 1× feels the same as one near 6×) instead of the
 * additive step that makes high zoom crawl.
 */
export const WHEEL_ZOOM_SENSITIVITY = 0.0015

/** Slack for float comparisons against {@link FIT_ZOOM}. */
const ZOOM_EPSILON = 0.001

/** Pan offset in CSS pixels, applied as a `translate` BEFORE the scale. */
export interface ViewOffset {
    x: number
    y: number
}

/** The un-panned position — also what every image change resets to. */
export const NO_OFFSET: ViewOffset = { x: 0, y: 0 }

/** Everything {@link clampOffset} needs: the frame, the fitted image, the zoom. */
export interface ViewportMetrics {
    /** Visible frame width in CSS px. */
    frameWidth: number
    /** Visible frame height in CSS px. */
    frameHeight: number
    /** LAYOUT width of the image at `scale(1)` (i.e. `offsetWidth`, transform-free). */
    contentWidth: number
    /** LAYOUT height of the image at `scale(1)`. */
    contentHeight: number
    /** Current zoom. */
    zoom: number
}

/**
 * Keeps a zoom inside `[FIT_ZOOM, MAX_ZOOM]`.
 *
 * A non-finite input (a `NaN` out of a division, a `deltaY` of `Infinity` from a stuck
 * wheel) collapses to the fit rather than blanking the viewer.
 *
 * @param zoom - Candidate zoom.
 * @returns The clamped zoom.
 */
export const clampZoom = (zoom: number): number => {
    if (!Number.isFinite(zoom)) {
        return FIT_ZOOM
    }
    return Math.min(MAX_ZOOM, Math.max(FIT_ZOOM, zoom))
}

/**
 * One step in.
 *
 * @param zoom - Current zoom.
 * @returns The next zoom, never past {@link MAX_ZOOM}.
 */
export const zoomIn = (zoom: number): number => clampZoom(zoom * ZOOM_STEP)

/**
 * One step out.
 *
 * @param zoom - Current zoom.
 * @returns The next zoom, never below {@link FIT_ZOOM}.
 */
export const zoomOut = (zoom: number): number => clampZoom(zoom / ZOOM_STEP)

/**
 * Zoom for one wheel event (ctrl/⌘ + wheel, or a trackpad pinch which the browser
 * reports as exactly that).
 *
 * @param zoom - Current zoom.
 * @param deltaY - The event's `deltaY` (negative = towards the reader = zoom in).
 * @returns The clamped zoom.
 */
export const zoomByWheel = (zoom: number, deltaY: number): number => {
    if (!Number.isFinite(deltaY)) {
        return clampZoom(zoom)
    }
    return clampZoom(zoom * Math.exp(-deltaY * WHEEL_ZOOM_SENSITIVITY))
}

/**
 * Whether the page is showing whole-page (so: nothing to pan, and the "fit" control has
 * nothing left to do).
 *
 * @param zoom - Current zoom.
 * @returns `true` at (or below) the fit.
 */
export const isFitted = (zoom: number): boolean => zoom <= FIT_ZOOM + ZOOM_EPSILON

/**
 * Zoom a double-click should land on: magnify from the fit, otherwise go back to it.
 *
 * @param zoom - Current zoom.
 * @returns The toggled zoom.
 */
export const toggleZoom = (zoom: number): number =>
    isFitted(zoom) ? clampZoom(DOUBLE_CLICK_ZOOM) : FIT_ZOOM

/**
 * How far the image may travel along one axis before its edge would be dragged inside the
 * frame.
 *
 * The image is CENTRED, so the overflow is split evenly on both sides: half the excess in
 * each direction. Nothing overflows while the scaled image still fits (the fitted state,
 * and any axis where the letterboxing leaves black bars), which yields `0` — the image
 * simply cannot be dragged off-centre there.
 *
 * @param frameSize - Frame extent on that axis.
 * @param contentSize - Fitted image extent on that axis (at `scale(1)`).
 * @param zoom - Current zoom.
 * @returns The maximum absolute offset, always ≥ 0.
 */
export const panLimit = (frameSize: number, contentSize: number, zoom: number): number => {
    const scaled = contentSize * clampZoom(zoom)
    if (!Number.isFinite(scaled) || !Number.isFinite(frameSize)) {
        return 0
    }
    return Math.max(0, (scaled - frameSize) / 2)
}

/**
 * Clamps a pan so the reader can never drag the page out of the frame (the classic
 * "where did my image go" of a hand-rolled zoom).
 *
 * @param offset - Candidate offset.
 * @param metrics - Frame / image / zoom — see {@link ViewportMetrics}.
 * @returns The offset, pinned inside the pannable box.
 */
export const clampOffset = (offset: ViewOffset, metrics: ViewportMetrics): ViewOffset => {
    const limitX = panLimit(metrics.frameWidth, metrics.contentWidth, metrics.zoom)
    const limitY = panLimit(metrics.frameHeight, metrics.contentHeight, metrics.zoom)
    const x = Number.isFinite(offset.x) ? offset.x : 0
    const y = Number.isFinite(offset.y) ? offset.y : 0
    // `+ 0` folds the `-0` that `Math.max(-0, negative)` yields on a non-pannable axis:
    // it renders identically but compares unequal to `0`, which makes both tests and
    // "did the offset change" checks lie.
    return {
        x: Math.min(limitX, Math.max(-limitX, x)) + 0,
        y: Math.min(limitY, Math.max(-limitY, y)) + 0,
    }
}

/**
 * Pins an index inside an album.
 *
 * @param index - Candidate position.
 * @param total - Album size.
 * @returns A position in `[0, total - 1]`, or `0` for an empty album.
 */
export const clampIndex = (index: number, total: number): number => {
    if (total <= 0) {
        return 0
    }
    return Math.min(Math.max(Math.trunc(index) || 0, 0), total - 1)
}

/**
 * Paging: move `delta` pages, WRAPPING at both ends — past the last page is page 1, before
 * page 1 is the last page.
 *
 * This used to stop dead at the ends, on the theory that an exam album is ordered paper and
 * a loop reads as a bug. Readers said otherwise: an album here is a set of practice
 * questions people go round more than once, and the caret going inert on the last page
 * reads as the viewer having broken rather than as the album having ended (the counter
 * already says which page it is, so nobody loses their place). The wrap goes BOTH ways on
 * purpose — a one-way loop is the genuinely surprising design.
 *
 * The double modulo is what makes a negative step land inside the album: `-1 % 3` is `-1`
 * in JS, not `2`.
 *
 * @param index - Current position.
 * @param delta - `-1` / `+1` (or any jump, including one larger than the album).
 * @param total - Album size.
 * @returns The new position, always inside `[0, total - 1]`.
 */
export const stepIndex = (index: number, delta: number, total: number): number => {
    if (total <= 0) {
        return 0
    }
    const from = clampIndex(index, total)
    const step = Number.isFinite(delta) ? Math.trunc(delta) : 0
    return (((from + step) % total) + total) % total
}
