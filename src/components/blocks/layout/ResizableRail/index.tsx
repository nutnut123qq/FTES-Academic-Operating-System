"use client"

import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link ResizableRail} block. */
export interface ResizableRailProps extends WithClassNames<undefined> {
    /** Rail content (e.g. the content-map tree). */
    children: ReactNode
    /** localStorage key the chosen width is persisted under. */
    storageKey: string
    /** Initial width in px before any persisted value loads. */
    defaultWidth?: number
    /** Smallest allowed width in px. */
    minWidth?: number
    /** Largest allowed width in px. */
    maxWidth?: number
    /** Accessible name for the drag handle (separator). */
    ariaLabel?: string
}

/**
 * A side rail whose width the reader can drag to resize, with the chosen width
 * persisted to `localStorage`. A thin handle pinned to the right edge is the
 * splitter: drag (pointer) or focus + Arrow keys to resize; the surrounding
 * content reflows. Tier-3 block — owns the handle styling + the ephemeral width
 * state; the rail body arrives via `children` (no store / SWR / data props).
 *
 * Positioning (sticky / hidden-on-mobile / max-height) is supplied by the caller
 * through `className`; this block only owns the width + the handle. The root is
 * NOT forced to `position: relative` — that would override a caller's
 * `lg:sticky`; the handle instead anchors to whatever positioned context the
 * caller establishes (the sticky rail itself).
 *
 * @param props - {@link ResizableRailProps}
 */
export const ResizableRail = ({
    children,
    storageKey,
    defaultWidth = 320,
    minWidth = 256,
    maxWidth = 560,
    ariaLabel,
    className,
}: ResizableRailProps) => {
    const [width, setWidth] = useState(defaultWidth)
    /** Latest width mirror so pointer-up can persist without a stale closure. */
    const widthRef = useRef(defaultWidth)
    /** Drag origin captured on pointer-down. */
    const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

    const clamp = useCallback(
        (value: number) => Math.min(Math.max(value, minWidth), maxWidth),
        [minWidth, maxWidth],
    )

    /** Commit a new width to state + the persistence ref. */
    const applyWidth = useCallback(
        (value: number) => {
            const next = clamp(value)
            widthRef.current = next
            setWidth(next)
        },
        [clamp],
    )

    // Hydrate the persisted width on mount (client-only; the SSR/first paint uses
    // `defaultWidth` so markup matches and there is no hydration mismatch).
    useEffect(() => {
        const stored = window.localStorage.getItem(storageKey)
        if (stored === null) {
            return
        }
        const parsed = Number(stored)
        if (!Number.isNaN(parsed)) {
            applyWidth(parsed)
        }
    }, [storageKey, applyWidth])

    const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        dragRef.current = { startX: event.clientX, startWidth: widthRef.current }
        document.body.style.cursor = "col-resize"
        document.body.style.userSelect = "none"
    }, [])

    const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) {
            return
        }
        applyWidth(dragRef.current.startWidth + (event.clientX - dragRef.current.startX))
    }, [applyWidth])

    const onPointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (!dragRef.current) {
            return
        }
        dragRef.current = null
        event.currentTarget.releasePointerCapture(event.pointerId)
        document.body.style.removeProperty("cursor")
        document.body.style.removeProperty("user-select")
        window.localStorage.setItem(storageKey, String(Math.round(widthRef.current)))
    }, [storageKey])

    const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        const step = event.shiftKey ? 32 : 16
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
            return
        }
        event.preventDefault()
        applyWidth(widthRef.current + (event.key === "ArrowLeft" ? -step : step))
        window.localStorage.setItem(storageKey, String(Math.round(widthRef.current)))
    }, [applyWidth, storageKey])

    return (
        <div className={cn(className)} style={{ width }}>
            {children}
            {/* splitter: a thin line at the right edge that thickens to accent on hover/drag */}
            <div
                role="separator"
                aria-orientation="vertical"
                aria-label={ariaLabel}
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onKeyDown={onKeyDown}
                className="group absolute inset-y-0 right-0 z-20 flex w-3 translate-x-1/2 cursor-col-resize items-stretch justify-center outline-none"
            >
                <span className="h-full w-px bg-separator transition-colors group-hover:bg-accent group-focus-visible:bg-accent" />
            </div>
        </div>
    )
}
