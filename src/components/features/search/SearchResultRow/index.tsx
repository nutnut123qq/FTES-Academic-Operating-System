import React from "react"
import { Typography, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { SearchRow } from "../types"
import { searchCategoryIcon } from "../map"
import { SearchHighlight } from "../SearchHighlight"

/** Props for {@link SearchResultRow}. */
export interface SearchResultRowProps extends WithClassNames<undefined> {
    /** The presentational row model. */
    row: SearchRow
    /** The active query (for match highlighting). */
    query: string
    /** Whether this row is the active/highlighted option (keyboard nav). */
    isActive?: boolean
    /** aria option id (for `aria-activedescendant`). */
    optionId?: string
    /** Activate (navigate) — fired on press when the row is routable. */
    onActivate?: () => void
    /** Hover moves the active option in the parent listbox. */
    onHover?: () => void
}

/**
 * One search result row — icon + title (highlighted) + breadcrumb/snippet. Renders
 * as an aria `option`; a routable row is pressable, an unroutable one (no resolved
 * href) is inert (non-interactive, breadcrumb only). Pure block: styling + render
 * logic only; the parent owns navigation + keyboard state.
 */
export const SearchResultRow = ({
    row,
    query,
    isActive = false,
    optionId,
    onActivate,
    onHover,
    className,
}: SearchResultRowProps) => {
    const Icon = searchCategoryIcon(row.kind)
    const interactive = Boolean(row.href)
    const support = row.breadcrumb ?? row.snippet

    return (
        <div
            id={optionId}
            role="option"
            aria-selected={isActive}
            aria-disabled={!interactive}
            onClick={interactive ? onActivate : undefined}
            onMouseMove={onHover}
            className={cn(
                "flex items-center gap-3 rounded-large p-2 transition-colors",
                interactive ? "cursor-pointer" : "cursor-default opacity-70",
                isActive && interactive ? "bg-accent/10" : undefined,
                className,
            )}
        >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-large bg-accent/10 text-accent">
                <Icon className="size-5" aria-hidden focusable="false" />
            </div>
            <div className="min-w-0 flex-1">
                <Typography type="body-sm" weight="medium" truncate>
                    <SearchHighlight text={row.title} query={query} />
                </Typography>
                {support ? (
                    <Typography type="body-xs" color="muted" className="truncate">
                        {support}
                    </Typography>
                ) : null}
            </div>
        </div>
    )
}
