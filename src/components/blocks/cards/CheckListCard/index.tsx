import React from "react"
import { cn } from "@heroui/react"
import { CheckCircleIcon } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CheckListCard}. */
export interface CheckListCardProps extends WithClassNames<undefined> {
    /** The list rows — typically {@link CheckListItem} elements. */
    children: ReactNode
}

/**
 * Static "list card" surface (see `elements/card.md` §3b): one bounded `bg-surface`
 * card whose rows are separated by inset dividers (the `Accordion variant="surface"`
 * look, but static — no expand, no click). Pair it with a `LabeledCard frameless`
 * for the section label so the label sits outside the card (no card-in-card).
 *
 * For clickable rows (navigation / selection) use `SurfaceListCard` instead — this
 * one is for read-only brief lists (value props, expected outputs, prerequisites…).
 *
 * @param props - See {@link CheckListCardProps}.
 */
export const CheckListCard = ({ children, className }: CheckListCardProps) => (
    <ul className={cn("overflow-hidden rounded-3xl border border-default bg-surface", className)}>
        {children}
    </ul>
)

/** Props for {@link CheckListItem}. */
export interface CheckListItemProps {
    /**
     * Show the leading success check (`CheckCircleIcon`, `text-success`). Default
     * `true`. Pass `false` for "things you need beforehand" lists (prerequisites) —
     * those are requirements, NOT achievements, so they carry no tick.
     */
    showCheck?: boolean
    /** Row body — plain text (`<Typography>`) or `<MarkdownContent>`. */
    children: ReactNode
}

/**
 * One row of a {@link CheckListCard}: an optional leading success check followed by a
 * free body. Rows are divided by an inset separator (the last row hides it).
 *
 * @param props - See {@link CheckListItemProps}.
 */
export const CheckListItem = ({ showCheck = true, children }: CheckListItemProps) => (
    <li className="relative flex items-start gap-3 px-4 py-4 after:absolute after:bottom-0 after:left-[3%] after:h-px after:w-[94%] after:bg-surface-foreground/6 after:content-[''] last:after:hidden">
        {showCheck ? (
            <CheckCircleIcon
                aria-hidden
                focusable="false"
                className="mt-0.5 size-5 shrink-0 text-success"
            />
        ) : null}
        <div className="min-w-0 flex-1">{children}</div>
    </li>
)
