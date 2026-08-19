"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { BadgeCatalogItem } from "@/modules/api/rest/gamification"
import { BadgeCatalogCell } from "./BadgeCatalogCell"

/** The one grid class shared by the skeleton and the real wall, so they line up. */
const GRID_CLASS = "grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8"

/** Skeleton — a grid of square tiles matching the real wall's columns. */
const GridSkeleton = () => (
    <div className={GRID_CLASS}>
        {Array.from({ length: 16 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
        ))}
    </div>
)

/** Props for {@link BadgeCatalogGrid}. */
export interface BadgeCatalogGridProps {
    /** True only while the FIRST load is in flight (no cached catalog yet). */
    isLoading: boolean
    /** Truthy → the request failed. Pass `undefined` when cached data can be shown. */
    error?: unknown
    /** The catalog; an EMPTY array is a valid answer, not a failure. */
    items: BadgeCatalogItem[]
    /** Re-runs the request from the error state's "try again" button. */
    onRetry: () => void
    /** Open the detail for a clicked badge. */
    onSelect: (badge: BadgeCatalogItem) => void
}

/**
 * The achievement WALL as a compact grid of square emblem tiles (see
 * {@link BadgeCatalogCell}) — hover a tile for its name, click for the goal and
 * progress. Same async-state contract as the old list: a failed request shows the
 * danger error with "try again"; an EMPTY catalog is a real, correct answer that
 * shows the neutral empty state, never a retry.
 */
export const BadgeCatalogGrid = ({
    isLoading,
    error,
    items,
    onRetry,
    onSelect,
}: BadgeCatalogGridProps) => {
    const t = useTranslations("profile.badgeCatalog")

    return (
        <AsyncContent
            isLoading={isLoading}
            skeleton={<GridSkeleton />}
            error={error}
            errorContent={{
                title: t("error"),
                description: t("errorDescription"),
                onRetry,
                retryLabel: t("retry"),
            }}
            isEmpty={items.length === 0}
            emptyContent={{ title: t("empty"), description: t("emptyDescription") }}
        >
            <div className={GRID_CLASS}>
                {items.map((badge) => (
                    <BadgeCatalogCell key={badge.code} badge={badge} onSelect={onSelect} />
                ))}
            </div>
        </AsyncContent>
    )
}
