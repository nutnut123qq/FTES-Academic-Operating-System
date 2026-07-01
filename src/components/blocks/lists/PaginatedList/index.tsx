import React from "react"
import { cn } from "@heroui/react"
import type { ReactNode } from "react"

import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for the {@link PaginatedList} block.
 *
 * This is the canonical "4-branch" presentational list wrapper. It owns no data
 * fetching and no state — every branch is supplied as a ReactNode slot by the
 * caller. The component simply decides which slot to render based on the boolean
 * flags, in a fixed priority order: error then loading then empty then data.
 */
export interface PaginatedListProps extends WithClassNames<undefined> {
    /**
     * When true, the list is in an error state and {@link PaginatedListProps.errorState}
     * is rendered. Takes priority over every other branch.
     */
    isLoading?: boolean
    /**
     * When true, the list failed to load and {@link PaginatedListProps.errorState}
     * is rendered. Has the highest render priority.
     */
    error?: boolean
    /**
     * When true (and not loading or in error), the list has no items and
     * {@link PaginatedListProps.emptyState} is rendered.
     */
    isEmpty?: boolean
    /**
     * Slot rendered while {@link PaginatedListProps.isLoading} is true (and there
     * is no error). Typically a skeleton placeholder.
     */
    skeleton?: ReactNode
    /**
     * Slot rendered when {@link PaginatedListProps.isEmpty} is true (and not
     * loading or in error). Typically an empty-state illustration with a hint.
     */
    emptyState?: ReactNode
    /**
     * Slot rendered when {@link PaginatedListProps.error} is true. Typically an
     * error illustration with a retry affordance.
     */
    errorState?: ReactNode
    /**
     * Pagination control rendered after {@link PaginatedListProps.children} in the
     * data branch only. Omit when there is a single page.
     */
    pagination?: ReactNode
    /**
     * The actual list content, rendered in the data branch (no error, not loading,
     * not empty).
     */
    children: ReactNode
}

/**
 * Presentational list orchestrator that selects exactly one of four branches —
 * error, loading, empty, or data — from props alone. It performs no data
 * fetching and holds no state; callers pass each branch as a ReactNode slot.
 *
 * Render priority: error -> loading -> empty -> data. In the data branch the
 * children are followed by the optional pagination slot.
 *
 * @param props - See {@link PaginatedListProps}.
 * @returns The rendered branch wrapped in a div carrying the merged className.
 */
export const PaginatedList = ({
    isLoading,
    error,
    isEmpty,
    skeleton,
    emptyState,
    errorState,
    pagination,
    children,
    className,
}: PaginatedListProps) => {
    /** Resolve the single branch to render in fixed priority order. */
    const content: ReactNode = error
        ? errorState
        : isLoading
            ? skeleton
            : isEmpty
                ? emptyState
                : (
                    <>
                        {children}
                        {pagination}
                    </>
                )

    return <div className={cn("flex flex-col gap-6", className)}>{content}</div>
}
