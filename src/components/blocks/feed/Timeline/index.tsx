import React from "react"
import type { ReactNode } from "react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link Timeline}. */
export interface TimelineProps extends WithClassNames<undefined> {
    /**
     * The row elements to render inside the timeline. Each child is expected to
     * be a self-contained row block (e.g. {@link FeedItem}) that describes one
     * activity or attempt. The Timeline only provides the vertical connector and
     * spacing — row content and layout are entirely the caller's responsibility.
     */
    children: ReactNode
}

/**
 * Vertical timeline wrapper that stacks activity or attempt row blocks beside a
 * continuous left connector line. The line is drawn with `border-l
 * border-separator` on the container; children are indented with `pl-4` so the
 * line runs to their left.
 *
 * Purely presentational tier-3 block: holds no state, performs no data access,
 * and applies no visual frame. Pass pre-built row blocks (e.g. FeedItem) as
 * `children`.
 *
 * @param props - {@link TimelineProps}
 */
export const Timeline = ({ children, className }: TimelineProps) => {
    return (
        <div
            className={cn(
                "relative flex flex-col gap-4",
                "border-l border-separator",
                "pl-4",
                className,
            )}
        >
            {children}
        </div>
    )
}
