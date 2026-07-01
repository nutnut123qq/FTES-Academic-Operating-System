import React from "react"
import { cn, Typography } from "@heroui/react"
import type { ReactNode } from "react"

import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for the {@link EmptyState} block.
 *
 * A presentational, props-only empty-state placeholder. All copy is passed in
 * as {@link ReactNode} so the caller supplies translated text — the block never
 * calls a translation hook itself.
 */
export interface EmptyStateProps extends WithClassNames<undefined> {
    /**
     * Optional decorative icon, typically a Phosphor icon element. Rendered at
     * roughly `size-8` with a muted tone above the title.
     */
    icon?: ReactNode
    /**
     * Primary message describing why the area is empty (e.g. "No results").
     */
    title: ReactNode
    /**
     * Optional supporting text giving more detail or guidance below the title.
     */
    description?: ReactNode
    /**
     * Optional call-to-action, typically a Button, rendered below the
     * description.
     */
    action?: ReactNode
}

/**
 * Centered empty-state placeholder for lists, panels, or sections that have no
 * content to show. Renders a vertical, centered stack of an optional icon, a
 * title, an optional description, and an optional action.
 *
 * This block intentionally omits a card wrapper — the caller is expected to
 * wrap it in a `SectionCard`/`Card` when a frame is desired.
 *
 * @param props - See {@link EmptyStateProps}.
 * @returns The rendered empty-state element.
 */
export const EmptyState = ({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) => {
    return (
        <div
            className={cn(
                "flex flex-col items-center text-center gap-3 py-6",
                className,
            )}
        >
            {icon ? (
                <span className="text-muted [&>svg]:size-8">{icon}</span>
            ) : null}
            <Typography weight="medium" align="center">{title}</Typography>
            {description ? (
                <Typography type="body-xs" color="muted" align="center">{description}</Typography>
            ) : null}
            {action}
        </div>
    )
}
