import React from "react"
import type { ReactNode } from "react"
import { Typography, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ThreadsPostRow}. */
export interface ThreadsPostRowProps extends WithClassNames<undefined> {
    /** Avatar element rendered in the fixed leading column (36px circle expected). */
    avatar: ReactNode
    /** Author display name (semibold, first on the header line). */
    authorName?: string
    /**
     * Custom author node rendered in place of `authorName`. Use this when the
     * author needs to be a link/hovercard instead of plain text.
     */
    author?: ReactNode
    /** Relative time label rendered muted right after the name. */
    timeLabel: string
    /**
     * Draw the vertical threadline under the avatar (Threads' signature
     * connector) — on while the post's inline thread/comments are shown.
     */
    threadline?: boolean
    /** Content column below the header line: title, body, engagement bar, thread. */
    children: ReactNode
}

/**
 * Threads-anatomy post row: a two-column grid — fixed 48px leading column
 * holding the author avatar (and, when `threadline`, a vertical separator-color
 * line running down to the content's end) + a flexible content column whose
 * first line is `author · relative time`. Borderless by design: rows are meant
 * to sit in a `divide-y divide-separator` column, not in cards.
 *
 * @param props - {@link ThreadsPostRowProps}
 */
export const ThreadsPostRow = ({
    avatar,
    authorName,
    author,
    timeLabel,
    threadline = false,
    children,
    className,
}: ThreadsPostRowProps) => {
    return (
        <div className={cn("grid grid-cols-[48px_minmax(0,1fr)] gap-x-2", className)}>
            <div className="flex flex-col items-center pt-0.5">
                {avatar}
                {threadline ? (
                    <div aria-hidden className="mt-2 w-0.5 flex-1 rounded-full bg-separator" />
                ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-2">
                <div className="flex min-w-0 items-baseline gap-2">
                    {author ? (
                        <span className="min-w-0">{author}</span>
                    ) : (
                        <Typography type="body-sm" weight="semibold" truncate>
                            {authorName}
                        </Typography>
                    )}
                    <Typography type="body-xs" color="muted" className="shrink-0">
                        {timeLabel}
                    </Typography>
                </div>
                {children}
            </div>
        </div>
    )
}
