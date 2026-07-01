import React from "react"
import { cn, Typography } from "@heroui/react"
import type { ReactNode } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for the {@link PageHeader} block.
 *
 * A tier-3 presentational block — every piece of content arrives via props.
 * No store reads, no SWR, no translation hooks.
 */
export interface PageHeaderProps extends WithClassNames<undefined> {
    /**
     * Primary page or section title. Rendered at `text-xl font-medium` in the
     * foreground tone. Accept a string or any inline React node (e.g. a
     * title with an inline badge).
     */
    title: ReactNode
    /**
     * Optional supporting description placed directly below the title. Rendered
     * at `text-sm` in the muted tone. Omit when the title is self-explanatory.
     */
    description?: ReactNode
    /**
     * Optional breadcrumb row rendered above the title row. Accepts any node —
     * typically a `<Breadcrumbs>` HeroUI component or a plain anchor chain.
     * Rendered at a smaller scale so it visually precedes the title hierarchy.
     */
    breadcrumb?: ReactNode
    /**
     * Optional right-aligned slot for action controls (e.g. `<Button>` or a
     * group of buttons). Rendered `shrink-0` so it never compresses the title
     * column.
     */
    actions?: ReactNode
    /**
     * Optional meta row placed BELOW the title/description — typically a row of
     * stat/meta chips ("24 Module · 87 Nội dung …"). Rendered `gap-3` from the
     * title block. Omit when the header carries no stats.
     */
    meta?: ReactNode
}

/**
 * Page/section header block. Renders an optional breadcrumb row above a flex
 * row that places a stacked title + description on the left and optional action
 * controls on the right.
 *
 * This block carries no card wrapper — the caller places it directly inside a
 * page layout or wraps it in a `SectionCard` when a framed surface is required.
 *
 * @param props - See {@link PageHeaderProps}.
 * @returns The rendered page header element.
 *
 * @example
 * <PageHeader
 *   breadcrumb={<Breadcrumbs .../>}
 *   title="Manage Users"
 *   description="View and edit all registered learners."
 *   actions={<Button>Invite</Button>}
 * />
 */
export const PageHeader = ({
    title,
    description,
    breadcrumb,
    actions,
    meta,
    className,
}: PageHeaderProps) => {
    return (
        // outer gap-3: breadcrumb ↔ title-block ↔ meta (different header tiers);
        // title ↔ description stay a tight gap-2 pair inside the title block.
        <div className={cn("flex flex-col gap-3", className)}>
            {/* Breadcrumb row — rendered only when provided, sits above the main title row */}
            {breadcrumb ? (
                <div>{breadcrumb}</div>
            ) : null}

            {/* Main row: title+description stack on the left, actions pinned to the right */}
            <div className="flex items-start justify-between gap-3">
                {/* Left column: stacked title and optional description */}
                <div className="flex min-w-0 flex-col gap-2">
                    <Typography.Heading level={3} weight="bold">{title}</Typography.Heading>
                    {description ? (
                        // clamp to 2 lines on mobile (keep the header short on a phone); full on sm+
                        <Typography type="body-sm" color="muted" className="line-clamp-2 sm:line-clamp-none">
                            {description}
                        </Typography>
                    ) : null}
                </div>

                {/* Right slot: shrink-0 prevents action buttons from being squeezed */}
                {actions ? (
                    <div className="shrink-0">{actions}</div>
                ) : null}
            </div>

            {/* Meta row: stat/meta chips below the title block (gap-3 from outer) */}
            {meta ? (
                <div>{meta}</div>
            ) : null}
        </div>
    )
}
