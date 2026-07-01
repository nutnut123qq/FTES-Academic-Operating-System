"use client"

import React from "react"
import {
    cn,
} from "@heroui/react"
import {
    useResolveRouteNavigation,
} from "../../EntityToken/useResolveRouteNavigation"
import { SurfaceListCardRow } from "@/components/blocks/cards/SurfaceListCard"

/** Props for {@link TrendingRow}. */
export interface TrendingRowProps {
    /** 1-based rank in the most-read list — drives the leading number + top-3 accent. */
    rank: number
    /** Lesson title (truncated by the row). */
    title: string
    /** Opaque global id resolved to a route on press. */
    globalId: string
}

/**
 * One row of the "Nổi bật tuần này" most-read list: a leading rank number (top-3
 * accented, the rest muted) and the lesson title — a whole-row clickable
 * surface-list item. The dashboard has no course context, so pressing resolves the
 * content's canonical path before navigating ({@link useResolveRouteNavigation}).
 * Read count is intentionally omitted (every count is "1" today — low signal); the
 * rank already conveys "most read".
 *
 * @param props - {@link TrendingRowProps}
 */
export const TrendingRow = ({ rank, title, globalId }: TrendingRowProps) => {
    const { onPress, pending, routable } = useResolveRouteNavigation({ globalId })

    return (
        <SurfaceListCardRow
            leading={(
                <span
                    aria-hidden
                    className={cn(
                        "w-5 shrink-0 text-center text-sm font-medium tabular-nums",
                        rank <= 3 ? "text-accent" : "text-muted",
                    )}
                >
                    {rank}
                </span>
            )}
            title={title}
            hover="underline"
            onPress={onPress}
            isDisabled={!routable || pending}
        />
    )
}
