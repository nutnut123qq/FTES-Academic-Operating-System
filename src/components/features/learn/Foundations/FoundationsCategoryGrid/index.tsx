"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    Typography,
} from "@heroui/react"
import type {
    FoundationsBreadcrumbItem,
} from "../types"
import {
    FoundationsBreadcrumbs,
} from "../shared/FoundationsBreadcrumbs"
import {
    FoundationsCategoryGridHeader,
} from "./FoundationsCategoryGridHeader"
import {
    FoundationsCategoryGridBody,
} from "./FoundationsCategoryGridBody"
import { pathConfig } from "@/resources/path"
import { useAppSelector } from "@/redux/hooks"
import { useQueryFoundationCategoriesSwr } from "@/hooks/swr/api/graphql/queries/useQueryFoundationCategoriesSwr"
import { useQueryFoundationCategorySuggestionsSwr } from "@/hooks/swr/api/graphql/queries/useQueryFoundationCategorySuggestionsSwr"
import type { FoundationCategorySuggestionItem } from "@/modules/api/graphql/queries/types/foundation-category-suggestions"
import { Pagination } from "@/components/reuseable/Pagination"
import { PaginationSkeleton } from "@/components/reuseable/PaginationSkeleton"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { SkeletonText } from "@/components/reuseable/SkeletonText"

/** Max category cards shown per page. */
const PAGE_SIZE = 10
/** Debounce window (ms) before a typed search hits the backend. */
const SEARCH_DEBOUNCE_MS = 350

/**
 * Foundations hub container: grid of category cards; selecting one opens the
 * category learn page.
 *
 * Server-side search + pagination: the debounced query and page drive the SWR
 * key, so the backend returns only the current page (no client-side filtering).
 * `"use client"` for routing, redux, and the debounce effect.
 */
export const FoundationsCategoryGridLayout = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const course = useAppSelector((state) => state.course.entity)
    const courseDisplayId = useAppSelector((state) => state.course.displayId)
    const categories = useAppSelector((state) => state.foundation.categories)

    /** Immediate input value (drives the field). */
    const [query, setQuery] = useState("")
    /** Debounced query that actually hits the backend. */
    const [debouncedQuery, setDebouncedQuery] = useState("")
    /** 1-based current page. */
    const [page, setPage] = useState(1)

    // debounce the search input; changing the query also resets to the first page
    useEffect(() => {
        const handle = setTimeout(() => {
            setDebouncedQuery(query)
            setPage(1)
        }, SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(handle)
    }, [query])

    // server-side: the backend returns exactly this page for this search
    const { data, isLoading } = useQueryFoundationCategoriesSwr({
        search: debouncedQuery,
        page,
        limit: PAGE_SIZE,
    })

    /** Categories for the current page (undefined while the first load is in flight). */
    const pageCategories = data?.data
    /** Total matching categories across all pages (from the server). */
    const totalCount = data?.totalCount ?? 0
    /** Total pages derived from the server total (at least 1). */
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
    /** Page clamped to the available range for the pagination control. */
    const currentPage = Math.min(page, totalPages)
    /** A search is active but the server returned no matches. */
    const hasNoMatches = !isLoading && debouncedQuery.trim().length > 0 && totalCount === 0

    // ES Completion Suggester (typeahead): clean { id, label } items from the BE,
    // no client-side filtering or label munging.
    const { data: suggestionItems } = useQueryFoundationCategorySuggestionsSwr(debouncedQuery)
    const suggestions = suggestionItems ?? []

    /** Fill the search box with the chosen suggestion (the grid then filters to it). */
    const onSelectSuggestion = useCallback(
        (suggestion: FoundationCategorySuggestionItem) => {
            setQuery(suggestion.label)
        },
        [],
    )

    /** Navigate to the localized home page. */
    const onPressHome = useCallback(() => {
        router.push(pathConfig().locale().build())
    }, [router])

    /** Navigate to the courses listing. */
    const onPressCourses = useCallback(() => {
        router.push(pathConfig().locale(locale).course().build())
    }, [locale, router])

    /** Navigate to the current course overview. */
    const onPressCourse = useCallback(() => {
        router.push(pathConfig().locale(locale).course(courseDisplayId).build())
    }, [courseDisplayId, locale, router])

    /** Breadcrumb trail from home → courses → course → foundations hub. */
    const breadcrumbItems = useMemo((): Array<FoundationsBreadcrumbItem> => [
        {
            key: "home",
            label: t("nav.home"),
            onPress: onPressHome,
        },
        {
            key: "courses",
            label: t("nav.courses"),
            onPress: onPressCourses,
        },
        {
            key: "course",
            label: course?.title || t("nav.courses"),
            onPress: onPressCourse,
        },
        {
            key: "foundations",
            label: t("foundations.title"),
        },
    ], [
        course?.title,
        onPressCourse,
        onPressCourses,
        onPressHome,
        t,
    ])

    return (
        // tier layout: PageHeader (breadcrumb+title+desc) → content cluster, gap-10 between (debt page-heading)
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
            <FoundationsCategoryGridHeader breadcrumb={<FoundationsBreadcrumbs items={breadcrumbItems} />} />
            {/* browse cluster: search row · grid · pager (gap-6 inside the cluster) */}
            <div className="flex flex-col gap-6">
                {/* search row: box (server-side, debounced) on the left, topic count right-aligned */}
                <div className="flex items-center justify-between gap-3">
                    <SearchInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder={t("foundations.searchPlaceholder")}
                        suggestions={suggestions}
                        onSelectSuggestion={onSelectSuggestion}
                    />
                    {categories === undefined ? (
                        <SkeletonText size="sm" width="w-[90px]" />
                    ) : (
                        <Typography type="body-sm" color="muted" className="shrink-0">
                            {t("foundations.categoryCount", { count: categories.length })}
                        </Typography>
                    )}
                </div>
                {hasNoMatches ? (
                    <Typography type="body-sm" color="muted">
                        {t("foundations.searchEmpty", { query: debouncedQuery.trim() })}
                    </Typography>
                ) : (
                    <>
                        <FoundationsCategoryGridBody
                            categories={pageCategories}
                            sortedCategories={pageCategories ?? []}
                            isLoading={isLoading && !data}
                        />
                        {isLoading && !data ? (
                            <PaginationSkeleton />
                        ) : totalCount > 0 ? (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setPage}
                            />
                        ) : null}
                    </>
                )}
            </div>
        </div>
    )
}
