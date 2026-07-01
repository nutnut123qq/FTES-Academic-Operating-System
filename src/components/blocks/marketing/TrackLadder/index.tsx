import React from "react"
import { cn, Typography } from "@heroui/react"
import { CaretRightIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One rung on the track ladder. */
export interface TrackLadderItem {
    /** Track label (e.g. "Fullstack"). */
    label: string
    /** Optional short caption under the label. */
    caption?: string
    /** Highlight this rung as the destination/peak (accent). */
    highlighted?: boolean
}

/** Props for the {@link TrackLadder} block. */
export interface TrackLadderProps extends WithClassNames<undefined> {
    /** Ordered tracks rendered left → right, joined by caret connectors. */
    tracks: ReadonlyArray<TrackLadderItem>
}

/**
 * Horizontal learning-track ladder: labelled rungs joined by caret connectors,
 * with the destination rung emphasised in accent. Scrolls horizontally so a long
 * ladder never crams. Tier-3 block — owns all styling, content via props.
 *
 * @param props - {@link TrackLadderProps}
 */
export const TrackLadder = ({ tracks, className }: TrackLadderProps) => {
    return (
        <div className={cn("flex items-stretch gap-3 overflow-x-auto pb-2", className)}>
            {tracks.map((track, index) => (
                <React.Fragment key={track.label}>
                    {index > 0 ? (
                        <div className="flex shrink-0 items-center">
                            <CaretRightIcon
                                aria-hidden
                                focusable="false"
                                className="size-5 text-muted"
                            />
                        </div>
                    ) : null}
                    <div
                        className={cn(
                            "flex min-w-40 flex-1 flex-col gap-1 rounded-xl border px-4 py-3",
                            track.highlighted
                                ? "border-accent/40 bg-accent/5"
                                : "border-separator bg-surface",
                        )}
                    >
                        <Typography
                            type="body-sm"
                            weight="semibold"
                            className={cn(track.highlighted && "text-accent")}
                        >
                            {track.label}
                        </Typography>
                        {track.caption ? (
                            <Typography type="body-xs" color="muted">
                                {track.caption}
                            </Typography>
                        ) : null}
                    </div>
                </React.Fragment>
            ))}
        </div>
    )
}
