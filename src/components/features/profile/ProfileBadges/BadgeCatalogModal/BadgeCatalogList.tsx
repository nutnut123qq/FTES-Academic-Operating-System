"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import type { BadgeCatalogItem } from "@/modules/api/rest/gamification"
import { BadgeCatalogRow } from "./BadgeCatalogRow"

/** Skeleton mirroring the row list (icon + two text lines + a meter). */
const CatalogSkeleton = () => (
    <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-start gap-3 rounded-2xl border border-separator p-4">
                <Skeleton className="size-10 shrink-0 rounded-large" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton.Typography type="body-sm" width="1/3" />
                    <Skeleton.Typography type="body-xs" width="2/3" />
                    <Skeleton.ProgressBar />
                </div>
            </div>
        ))}
    </div>
)

/** Props for {@link BadgeCatalogList}. */
export interface BadgeCatalogListProps {
    /** True only while the FIRST load is in flight (no cached catalog yet). */
    isLoading: boolean
    /** Truthy → the request failed. Pass `undefined` when cached data can be shown. */
    error?: unknown
    /** The catalog; an EMPTY array is a valid answer, not a failure. */
    items: BadgeCatalogItem[]
    /** Re-runs the request from the error state's "try again" button. */
    onRetry: () => void
}

/**
 * Body of the "All badges" dialog — the async-state switch plus the row list.
 *
 * The distinction this component exists to protect: **"the system has no badges"
 * is not "we could not reach the server"**. An empty catalog is a real, correct
 * answer (a fresh install, or an admin who disabled every badge) and must render
 * the neutral empty state with no retry button; only a failed request renders the
 * danger error state with "try again". Collapsing the two would tell the user to
 * keep retrying a request that already succeeded.
 */
export const BadgeCatalogList = ({ isLoading, error, items, onRetry }: BadgeCatalogListProps) => {
    const t = useTranslations("profile.badgeCatalog")

    return (
        <AsyncContent
            isLoading={isLoading}
            skeleton={<CatalogSkeleton />}
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
            <ul className="flex list-none flex-col gap-3 p-0">
                {items.map((badge) => (
                    <BadgeCatalogRow key={badge.code} badge={badge} />
                ))}
            </ul>
        </AsyncContent>
    )
}
