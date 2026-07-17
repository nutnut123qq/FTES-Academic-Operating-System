"use client"

import { useMemo } from "react"
import { useLocale, useTranslations } from "next-intl"
import { pathConfig } from "@/resources/path"
import { useQueryRecommendedCoursesSwr } from "@/hooks/swr/api/graphql/queries/useQueryRecommendedCoursesSwr"
import type { SearchRow } from "../types"

/** Max popular suggestions shown in the idle palette. */
const POPULAR_LIMIT = 6

/** Return shape of {@link usePopularSearchRows}. */
export interface UsePopularSearchRowsResult {
    /** Popular course rows (icon + title + price), each deep-linking to its detail page. */
    rows: Array<SearchRow>
    /** First-load state (no data yet, no error). */
    isLoading: boolean
}

/** Format a VND amount in the house VND-primary style (`1.200.000₫`). */
const formatVnd = (amount: number): string => `${amount.toLocaleString("vi-VN")}₫`

/**
 * Popular-course suggestions for the idle search palette (empty query). Maps the
 * viewer's recommended (not-enrolled) courses — priced with their loyalty discount —
 * into {@link SearchRow}s carrying a leading course icon, the title, a trailing
 * charged price, and a direct deep link to the course detail page. User-scoped:
 * empty for guests (the underlying recommendation query only runs authenticated).
 */
export const usePopularSearchRows = (): UsePopularSearchRowsResult => {
    const locale = useLocale()
    const t = useTranslations()
    const { data, isLoading } = useQueryRecommendedCoursesSwr()

    const rows = useMemo<Array<SearchRow>>(() => {
        const items = data?.items ?? []
        return items.slice(0, POPULAR_LIMIT).map((item) => ({
            id: `popular-${item.displayId}`,
            kind: "courses" as const,
            title: item.title,
            price:
                item.discountedPriceVnd > 0
                    ? formatVnd(item.discountedPriceVnd)
                    : t("search.free"),
            href: pathConfig().locale(locale).course(item.displayId).build(),
        }))
    }, [data, locale, t])

    return { rows, isLoading: isLoading && rows.length === 0 }
}
