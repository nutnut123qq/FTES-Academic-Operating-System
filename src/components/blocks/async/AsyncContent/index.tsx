"use client"

import React from "react"
import type { ReactNode } from "react"

import { EmptyContent } from "../EmptyContent"
import type { EmptyContentProps } from "../EmptyContent"
import { ErrorContent } from "../ErrorContent"
import type { ErrorContentProps } from "../ErrorContent"

/**
 * Props for the {@link AsyncContent} block.
 */
export interface AsyncContentProps {
    /**
     * True while the first load is in flight (no cached data yet). While true the
     * {@link skeleton} is shown. Pass the resolved condition, e.g.
     * `isLoading && items.length === 0`.
     */
    isLoading: boolean
    /**
     * Layout-matching skeleton shown while loading (e.g. a tree of `Skeleton.*`
     * mirroring the real layout), so the box never collapses or jumps on resolve.
     */
    skeleton: ReactNode
    /**
     * When true (after loading resolves), the {@link EmptyContent} is shown
     * instead of {@link children}.
     */
    isEmpty?: boolean
    /**
     * Props for the empty state — passed straight to {@link EmptyContent}. Omit to
     * render nothing when empty (self-hiding section).
     */
    emptyContent?: EmptyContentProps
    /**
     * Truthy → the {@link ErrorContent} is shown (takes priority over loading).
     * Pass the SWR `error` (only when there is no cached data to fall back to).
     */
    error?: unknown
    /**
     * Props for the error state — passed straight to {@link ErrorContent}.
     */
    errorContent?: ErrorContentProps
    /**
     * The loaded content, shown once loading resolves with non-empty data.
     */
    children: ReactNode
}

/**
 * Standard async-state switch for any data-backed region — the single source for
 * the error / loading / empty / content branches the SWR render contract
 * requires (starci-async.md). Renders, in priority order:
 *
 *   error → loading → empty → content
 *
 * The empty/error states are configured by passing their PROPS (not nodes):
 * `emptyContent={{ title, onRetry, retryLabel }}`. The `skeleton` is a tree of
 * `Skeleton.*` that mirrors the real layout.
 */
export const AsyncContent = ({
    isLoading,
    skeleton,
    isEmpty = false,
    emptyContent,
    error,
    errorContent,
    children,
}: AsyncContentProps) => {
    if (error && errorContent) {
        return <ErrorContent {...errorContent} />
    }
    if (isLoading) {
        return <>{skeleton}</>
    }
    if (isEmpty) {
        return emptyContent ? <EmptyContent {...emptyContent} /> : null
    }
    return <>{children}</>
}
