"use client"

import React, {
    useCallback,
    useRef,
} from "react"
import {
    ScrollShadow,
    cn,
} from "@heroui/react"
import {
    motion,
    type PanInfo,
} from "framer-motion"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link DragScrollArea}. */
export interface DragScrollAreaProps extends WithClassNames<undefined> {
    /** Scrollable content. */
    children: React.ReactNode
    /** Hide the native scrollbar (default true). */
    hideScrollBar?: boolean
    /** ScrollShadow edge fade size in px. */
    size?: number
}

/**
 * Vertical scroll region with hidden scrollbar and Framer Motion pointer pan.
 *
 * Wheel/trackpad/touch scroll still work; `onPan` maps drag delta to `scrollTop`
 * so Windows users can scroll when the bar is hidden. Presentational only.
 * @param props - {@link DragScrollAreaProps}
 */
export const DragScrollArea = ({
    className,
    children,
    hideScrollBar = true,
    size = 40,
}: DragScrollAreaProps) => {
    const scrollRef = useRef<HTMLDivElement>(null)

    const onPan = useCallback((_event: PointerEvent, info: PanInfo) => {
        const element = scrollRef.current
        if (!element) {
            return
        }
        element.scrollTop -= info.delta.y
    }, [])

    return (
        <ScrollShadow
            ref={scrollRef}
            hideScrollBar={hideScrollBar}
            size={size}
            className={cn("overflow-y-auto", className)}
        >
            <motion.div
                className="min-h-min"
                onPan={onPan}
            >
                {children}
            </motion.div>
        </ScrollShadow>
    )
}
