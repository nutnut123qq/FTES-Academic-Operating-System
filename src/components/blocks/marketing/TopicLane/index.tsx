import React from "react"
import { cn, Typography } from "@heroui/react"
import type { ReactNode } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** One topic row in a {@link TopicLane}. */
export interface TopicLaneItem {
    /** Lesson/topic title (technical, kept as-is across locales). */
    label: string
    /** Short course tag shown on the right (e.g. `SD` / `FS` / `DO`). */
    tag: string
    /** Press handler — navigates to the topic's course/lesson. Omit = static row. */
    onPress?: () => void
}

/** Props for the {@link TopicLane} block. */
export interface TopicLaneProps extends WithClassNames<undefined> {
    /** Lane icon (e.g. code vs infrastructure). */
    icon: ReactNode
    /** Lane title. */
    title: string
    /** The topic rows in this lane. */
    items: ReadonlyArray<TopicLaneItem>
}

/**
 * A labelled vertical lane of clickable "trophy topic" rows — a real lesson title
 * on the left, a short course tag on the right. Used to showcase the depth of the
 * curriculum (e.g. one lane for code topics, one for infrastructure). Pure tier-3
 * block: owns its look; the owning feature supplies data + press handlers.
 *
 * @param props - {@link TopicLaneProps}
 */
export const TopicLane = ({ icon, title, items, className }: TopicLaneProps) => {
    return (
        <div className={cn("flex flex-col gap-3", className)}>
            <div className="flex items-center gap-2">
                <span className="text-accent [&>svg]:size-5">{icon}</span>
                <Typography type="body-sm" weight="semibold">
                    {title}
                </Typography>
            </div>
            <div className="flex flex-col gap-2">
                {items.map((item, index) => (
                    <button
                        key={`${item.label}-${index}`}
                        type="button"
                        onClick={item.onPress}
                        className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-default bg-surface px-3 py-2 text-left outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-accent"
                    >
                        <Typography type="body-sm" className="min-w-0 truncate group-hover:text-accent">
                            {item.label}
                        </Typography>
                        <Typography type="code" className="shrink-0 text-[10px] text-muted">
                            {item.tag}
                        </Typography>
                    </button>
                ))}
            </div>
        </div>
    )
}
