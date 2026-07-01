"use client"

import React from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link InfiniteScrollSentinel}. */
export interface InfiniteScrollSentinelProps extends WithClassNames<undefined> {
    /** Fired once each time the sentinel scrolls into view (and `disabled` is false). */
    onReach: () => void
    /** When true the observer is detached (e.g. no more pages / a load in flight). */
    disabled?: boolean
    /** Scroll root to observe within (defaults to the viewport). */
    root?: Element | null
}

/**
 * Invisible end-of-list marker for infinite scroll: an `IntersectionObserver`
 * fires {@link InfiniteScrollSentinelProps.onReach} when it becomes visible, so
 * the list grows on scroll instead of via a "load more" button. Pair with a
 * `useSWRInfinite` hook — `onReach={() => setSize((s) => s + 1)}`,
 * `disabled={!hasMore || isValidating}` (see `starci-async.md`).
 */
export const InfiniteScrollSentinel = ({
    onReach,
    disabled = false,
    root = null,
    className,
}: InfiniteScrollSentinelProps) => {
    const ref = React.useRef<HTMLDivElement>(null)
    // keep the latest callback without re-subscribing the observer each render
    const onReachRef = React.useRef(onReach)
    onReachRef.current = onReach

    React.useEffect(() => {
        const node = ref.current
        if (!node || disabled) {
            return
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    onReachRef.current()
                }
            },
            { root, rootMargin: "120px" },
        )
        observer.observe(node)
        return () => observer.disconnect()
    }, [disabled, root])

    return <div ref={ref} aria-hidden className={cn("h-px w-full", className)} />
}
