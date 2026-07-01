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
} from "./types"
import {
    FoundationsBreadcrumbs,
} from "./shared/FoundationsBreadcrumbs"
import {
    FoundationsLearnHeader,
} from "./FoundationsLearnHeader"
import {
    FoundationsList,
} from "./FoundationsList"
import { pathConfig } from "@/resources/path"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setFoundationLimit, setFoundationPageNumber, setFoundationSearch } from "@/redux/slices/foundation"
import { useQueryFoundationCategoriesSwr } from "@/hooks/swr/api/graphql/queries/useQueryFoundationCategoriesSwr"
import { useQueryFoundationsSwr } from "@/hooks/swr/api/graphql/queries/useQueryFoundationsSwr"
import { Pagination } from "@/components/reuseable/Pagination"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { SkeletonText } from "@/components/reuseable/SkeletonText"

export { FoundationsCategoryGridLayout } from "./FoundationsCategoryGrid"
export { FoundationResourceLayout } from "./FoundationResourceLayout"

/** Max foundation resources shown per page. */
const PAGE_SIZE = 10
/** Debounce window (ms) before a typed search hits the backend. */
const SEARCH_DEBOUNCE_MS = 350

/** One search-box suggestion built from a foundation resource (`{ id, label }`). */
interface FoundationResourceSuggestion {
    /** Foundation resource id (selecting it narrows the grid). */
    id: string
    /** Display label shown in the suggestion list (the resource title). */
    label: string
}

/**
 * Learn foundations page container (resources within a category).
 *
 * Server-side search + pagination via the `foundations` query: the debounced
 * search, page number and page size live in Redux and drive the SWR key, so the
 * backend returns only the current page (no client-side filtering). Selecting a
 * resource navigates to its dedicated page (see `FoundationCard`). `"use client"`
 * for routing, redux and the debounced search.
 */
export const FoundationsLearnLayout = () => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()
    const dispatch = useAppDispatch()
    const course = useAppSelector((state) => state.course.entity)
    const courseDisplayId = useAppSelector((state) => state.course.displayId)
    const category = useAppSelector((state) => state.foundation.category)
    const foundations = useAppSelector((state) => state.foundation.entities)
    const count = useAppSelector((state) => state.foundation.count)
    const pageNumber = useAppSelector((state) => state.foundation.pageNumber)
    const search = useAppSelector((state) => state.foundation.search)

    useQueryFoundationCategoriesSwr()
    const { data: foundationsData, isLoading: isFoundationsLoading } = useQueryFoundationsSwr()

    /** Immediate search input value (drives the field). */
    const [query, setQuery] = useState("")

    // when the active category changes, reset paging/search to a clean first page (size 10)
    useEffect(() => {
        dispatch(setFoundationLimit(PAGE_SIZE))
        dispatch(setFoundationPageNumber(1))
        dispatch(setFoundationSearch(undefined))
        setQuery("")
    }, [category?.id, dispatch])

    // debounce the input into redux; changing the search resets to the first page
    useEffect(() => {
        const handle = setTimeout(() => {
            dispatch(setFoundationSearch(query))
            dispatch(setFoundationPageNumber(1))
        }, SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(handle)
    }, [query, dispatch])

    /** Total pages derived from the server count + page size (at least 1). */
    const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
    /** Current page clamped to the available range. */
    const currentPage = Math.min(pageNumber ?? 1, totalPages)
    /** A search is active but the server returned no matches. */
    const hasNoMatches = !isFoundationsLoading
        && foundations !== undefined
        && (search?.trim().length ?? 0) > 0
        && count === 0

    /** Change the current page of resources. */
    const onPageChange = useCallback((nextPage: number) => {
        dispatch(setFoundationPageNumber(nextPage))
    }, [dispatch])

    /** Breadcrumb trail from home → courses → course → foundations hub → category. */
    const breadcrumbItems = useMemo((): Array<FoundationsBreadcrumbItem> => [
        {
            key: "home",
            label: t("nav.home"),
            onPress: () => router.push(pathConfig().locale().build()),
        },
        {
            key: "courses",
            label: t("nav.courses"),
            onPress: () => router.push(pathConfig().locale(locale).course().build()),
        },
        {
            key: "course",
            label: course?.title || t("nav.courses"),
            onPress: () => router.push(pathConfig().locale(locale).course(courseDisplayId).build()),
        },
        {
            key: "foundations-hub",
            label: t("foundations.title"),
            onPress: () => router.push(
                pathConfig().locale(locale).course(courseDisplayId).learn().foundations().build(),
            ),
        },
        {
            key: "foundations",
            label: category?.title || t("foundations.title"),
        },
    ], [
        category?.title,
        course?.title,
        courseDisplayId,
        locale,
        router,
        t,
    ])

    // typeahead suggestions for the resource search — reuse the category-scoped server
    // search results (titles) so the dropdown matches the grid without a separate endpoint
    const resourceSuggestions = useMemo(
        () => (foundations ?? []).map((f) => ({
            id: f.id,
            label: f.title,
        })),
        [foundations],
    )

    /** Fill the search box with the chosen resource title (the grid then narrows to it). */
    const onSelectResourceSuggestion = useCallback(
        (suggestion: FoundationResourceSuggestion) => {
            setQuery(suggestion.label)
        },
        [],
    )

    return (
        // tier layout: PageHeader (breadcrumb+title+desc) → content cluster, gap-10 between (debt page-heading)
        <div className="mx-auto flex max-w-3xl flex-col gap-10">
            <FoundationsLearnHeader breadcrumb={<FoundationsBreadcrumbs items={breadcrumbItems} />} />
            {/* browse cluster: search row · list · pager (gap-6 inside the cluster) */}
            <div className="flex flex-col gap-6">
                {/* search row: box (server-side, debounced) on the left, resource count right-aligned */}
                <div className="flex items-center justify-between gap-3">
                    <SearchInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder={t("foundations.searchResourcesPlaceholder")}
                        suggestions={resourceSuggestions}
                        onSelectSuggestion={onSelectResourceSuggestion}
                    />
                    {(isFoundationsLoading && !foundationsData) || foundations === undefined ? (
                        <SkeletonText size="sm" width="w-[110px]" />
                    ) : (
                        <Typography type="body-sm" color="muted" className="shrink-0">
                            {t("foundations.count", { count: count ?? 0 })}
                        </Typography>
                    )}
                </div>
                {hasNoMatches ? (
                    <Typography type="body-sm" color="muted">
                        {t("foundations.searchResourcesEmpty", { query: search?.trim() ?? "" })}
                    </Typography>
                ) : (
                    <>
                        <FoundationsList />
                        {/* server-driven pagination; persists across page/search loads (count in redux) */}
                        {(count ?? 0) > 0 ? (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={onPageChange}
                            />
                        ) : null}
                    </>
                )}
            </div>
        </div>
    )
}
