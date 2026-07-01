import React from "react"
import type { ReactNode } from "react"
import { Label, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link LabeledList} block. */
export interface LabeledListProps extends WithClassNames<undefined> {
    /** Section label (text) shown above the list. */
    label: ReactNode
    /** Optional leading icon before the label (e.g. a phosphor `*Icon`). */
    icon?: ReactNode
    /** The list items — rendered as a vertical `gap-2` stack (caller renders rows). */
    children: ReactNode
    /**
     * Optional footer action pinned below the list (e.g. a primary CTA button).
     * Rendered as the third group, `gap-3` from the list.
     */
    action?: ReactNode
}

/**
 * A labeled vertical list — NO card frame: an icon + `Label` header, a `gap-2`
 * stack of item rows, and an optional footer action, with the three groups spaced
 * `gap-3` (label ↔ list ↔ action). For rail / panel blocks that are a
 * "label + short list (+ CTA)" where a full card would be too heavy (e.g. the
 * lesson rail's review / practice panels). The block owns spacing + label; the
 * caller passes label / icon / rows / action only.
 *
 * @param props - {@link LabeledListProps}
 */
export const LabeledList = ({
    label,
    icon,
    children,
    action,
    className,
}: LabeledListProps) => (
    <section className={cn("flex flex-col gap-3", className)}>
        <div className="flex items-center gap-2">
            {icon}
            <Label>{label}</Label>
        </div>
        <div className="flex flex-col gap-2">{children}</div>
        {action}
    </section>
)
