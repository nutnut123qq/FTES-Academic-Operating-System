"use client"

import React from "react"
import {
    useTranslations,
} from "next-intl"
import {
    FoundationCategoryCard,
} from "../../FoundationCategoryCard"
import {
    FoundationCategoryCardSkeleton,
} from "../../FoundationCategoryCard/FoundationCategoryCardSkeleton"
import type { FoundationCategoryEntity } from "@/modules/types/entities/foundation-category"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { SurfaceListCard } from "@/components/blocks/cards/SurfaceListCard"

/** Props for {@link FoundationsCategoryGridBody}. */
export interface FoundationsCategoryGridBodyProps extends WithClassNames<undefined> {
    /** Raw categories for the current page; `undefined` while still loading. */
    categories?: Array<FoundationCategoryEntity>
    /** Categories sorted for display (by order index). */
    sortedCategories: Array<FoundationCategoryEntity>
    /** Whether the categories query is in flight. */
    isLoading: boolean
}

/** Number of skeleton rows shown while the categories load. */
const SKELETON_ROWS = 6

/**
 * Foundations category list body: skeleton rows while loading, empty state, or the
 * joined link-and-caret list.
 *
 * Rows ({@link FoundationCategoryCard}) own their own selection dispatch + navigation
 * and render as {@link import("@/components/blocks").ListRow}s inside one `p-0` house
 * card surface (a joined list with full-width dividers — the `Accordion
 * variant="surface"` look, not a real accordion); this component only handles the
 * container, ordering, and loading state.
 * @param props.categories - Raw categories for empty-state check.
 * @param props.sortedCategories - Display-ordered categories.
 * @param props.isLoading - Shows skeletons when true and no data cached.
 * @param props.className - Optional root class names.
 */
export const FoundationsCategoryGridBody = ({
    categories,
    sortedCategories,
    isLoading,
    className,
}: FoundationsCategoryGridBodyProps) => {
    const t = useTranslations()

    return (
        <AsyncContent
            isLoading={isLoading}
            isEmpty={!categories?.length}
            emptyContent={{ title: t("foundations.emptyCategories") }}
            skeleton={(
                <SurfaceListCard className={className}>
                    {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                        <FoundationCategoryCardSkeleton
                            key={index}
                            divider={index < SKELETON_ROWS - 1}
                        />
                    ))}
                </SurfaceListCard>
            )}
        >
            <SurfaceListCard className={className}>
                {sortedCategories.map((category) => (
                    <FoundationCategoryCard
                        key={category.id}
                        category={category}
                    />
                ))}
            </SurfaceListCard>
        </AsyncContent>
    )
}
