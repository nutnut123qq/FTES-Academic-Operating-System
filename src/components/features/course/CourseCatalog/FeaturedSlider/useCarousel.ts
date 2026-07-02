"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { FocusEvent } from "react"
import { useMediaQuery } from "usehooks-ts"

/** Autoplay interval between slide advances (ms). */
export const AUTOPLAY_INTERVAL_MS = 5_000

/**
 * Controls a native CSS scroll-snap carousel track (no carousel dependency —
 * decision logged in the change's design.md). The track is a `snap-x snap-mandatory`
 * flex row of full-width `snap-center` slides; swipe/momentum is native. This hook
 * adds: the active index (derived from scroll position), programmatic navigation
 * (`scrollToIndex` / `next` / `prev`, wrapping at both ends), and a 5s autoplay that
 * pauses on hover, focus-within and document-hidden — and is disabled entirely under
 * `prefers-reduced-motion` or with fewer than 2 slides (reduced motion also makes
 * programmatic scrolls instant instead of smooth).
 *
 * Slides may be full-track-width (hero) or fixed-width cards (category shelves) —
 * the active index is derived from the child offset nearest the scroll position,
 * so both work. Pass `{ autoplay: false }` for manual-only tracks (shelves never
 * auto-advance; only the hero autoplays).
 *
 * @param slideCount - Number of slides currently in the track.
 * @param options - Optional behaviour flags (`autoplay` defaults to `true`).
 */
export const useCarousel = (slideCount: number, options?: { autoplay?: boolean }) => {
    const autoplayEnabled = options?.autoplay ?? true
    const trackRef = useRef<HTMLDivElement | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [isHovered, setIsHovered] = useState(false)
    const [isFocusedWithin, setIsFocusedWithin] = useState(false)
    const [isDocumentHidden, setIsDocumentHidden] = useState(false)
    const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)")

    /** Scrolls the track to the slide at `index`, wrapping past either end. */
    const scrollToIndex = useCallback(
        (index: number) => {
            const track = trackRef.current
            if (!track || slideCount === 0) return
            const wrapped = ((index % slideCount) + slideCount) % slideCount
            const slide = track.children.item(wrapped) as HTMLElement | null
            if (!slide) return
            track.scrollTo({
                left: slide.offsetLeft,
                // reduced motion → instant jumps, never smooth animation
                behavior: prefersReducedMotion ? "auto" : "smooth",
            })
        },
        [slideCount, prefersReducedMotion],
    )

    // next wraps to the start once the track is scrolled to its very end — with
    // card-width slides the LAST index is never the nearest-to-scrollLeft child
    // (the viewport shows several cards), so the plain index wrap can't fire there
    const next = useCallback(() => {
        const track = trackRef.current
        if (track && Math.ceil(track.scrollLeft + track.clientWidth) >= track.scrollWidth && activeIndex > 0) {
            scrollToIndex(0)
            return
        }
        scrollToIndex(activeIndex + 1)
    }, [scrollToIndex, activeIndex])
    const prev = useCallback(() => scrollToIndex(activeIndex - 1), [scrollToIndex, activeIndex])

    // active index ← scroll position: the child whose left edge is nearest to
    // scrollLeft (equals scrollLeft / width for full-width hero slides; also keeps
    // dots in sync after native swipes)
    useEffect(() => {
        const track = trackRef.current
        if (!track || slideCount === 0) return
        const onScroll = () => {
            let nearest = 0
            let nearestDistance = Number.POSITIVE_INFINITY
            for (let index = 0; index < track.children.length; index += 1) {
                const child = track.children.item(index) as HTMLElement
                const distance = Math.abs(child.offsetLeft - track.scrollLeft)
                if (distance < nearestDistance) {
                    nearestDistance = distance
                    nearest = index
                }
            }
            setActiveIndex(Math.min(nearest, slideCount - 1))
        }
        track.addEventListener("scroll", onScroll, { passive: true })
        return () => track.removeEventListener("scroll", onScroll)
    }, [slideCount])

    // autoplay also pauses while the tab is hidden (no invisible spinning)
    useEffect(() => {
        const onVisibilityChange = () => setIsDocumentHidden(document.hidden)
        document.addEventListener("visibilitychange", onVisibilityChange)
        return () => document.removeEventListener("visibilitychange", onVisibilityChange)
    }, [])

    const isAutoplaying =
        autoplayEnabled &&
        slideCount >= 2 &&
        !prefersReducedMotion &&
        !isHovered &&
        !isFocusedWithin &&
        !isDocumentHidden

    // depending on activeIndex intentionally restarts the 5s timer after ANY slide
    // change (autoplay tick or manual nav) — manual nav gets a full quiet window
    useEffect(() => {
        if (!isAutoplaying) return
        const id = window.setInterval(() => scrollToIndex(activeIndex + 1), AUTOPLAY_INTERVAL_MS)
        return () => window.clearInterval(id)
    }, [isAutoplaying, activeIndex, scrollToIndex])

    /** Spread on the carousel region: pauses autoplay on hover + focus-within. */
    const pauseHandlers = {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
        onFocusCapture: () => setIsFocusedWithin(true),
        onBlurCapture: (event: FocusEvent<HTMLElement>) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsFocusedWithin(false)
            }
        },
    }

    return { trackRef, activeIndex, isAutoplaying, scrollToIndex, next, prev, pauseHandlers }
}
