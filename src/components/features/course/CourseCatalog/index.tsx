"use client"

import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react"
import {
    Breadcrumbs,
    Pagination,
} from "@heroui/react"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import {
    useRouter,
} from "next/navigation"
import {
    CatalogCourseCard,
} from "./CatalogCourseCard"
import type {
    WithClassNames,
} from "@/modules/types/base/class-name"
import { SearchInput } from "@/components/reuseable/SearchInput"
import { useQueryCoursesSwr } from "@/hooks/swr/api/graphql/queries/useQueryCoursesSwr"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { CourseCardSkeleton } from "@/components/blocks/cards/CourseCardSkeleton"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { pathConfig } from "@/resources/path"

/** Debounce window (ms) before a typed search hits the backend. */
const SEARCH_DEBOUNCE_MS = 350
/** Courses per page (3 columns × 3 rows on desktop). */
const PAGE_SIZE = 9

/** Props for {@link CourseCatalog}. */
export type CourseCatalogProps = WithClassNames<undefined>

/**
 * Featured courses catalog (UI 2.0 feature).
 *
 * Left-aligned header (breadcrumb → title + result count → search), then a
 * server-side searchable + paginated grid (ES-backed `courses`) rendered through
 * {@link AsyncContent} with the {@link CourseCard} / {@link CourseCardSkeleton}
 * blocks. Self-contained: owns the search + page state and reads the courses SWR.
 *
 * @param props - optional className (placement only).
 */
export const CourseCatalog = ({ className }: CourseCatalogProps) => {
    const t = useTranslations()
    const locale = useLocale()
    const router = useRouter()

    /** Immediate input value (drives the field). */
    const [query, setQuery] = useState("")
    /** Debounced query that actually hits the backend. */
    const [debouncedQuery, setDebouncedQuery] = useState("")
    /** Zero-based page index. */
    const [pageNumber, setPageNumber] = useState(0)

    // debounce the search input before it reaches the backend
    useEffect(() => {
        const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(handle)
    }, [query])

    // a new search always restarts at the first page
    useEffect(() => {
        setPageNumber(0)
    }, [debouncedQuery])

    const swr = useQueryCoursesSwr({
        search: debouncedQuery,
        pageNumber,
        limit: PAGE_SIZE,
    })
    const payload = swr.data?.courses?.data
    const list = useMemo(() => payload?.data ?? [], [payload])
    const count = payload?.count ?? 0
    const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
    const currentPage = pageNumber + 1
    const pageNumbers = useMemo(
        () => Array.from({ length: totalPages }, (_, index) => index + 1),
        [totalPages],
    )

    /** Navigate to the home page (breadcrumb root). */
    const onNavigateHome = useCallback(
        () => router.push(pathConfig().locale(locale).build()),
        [router, locale],
    )

    return (
        <div className={className}>
            <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-6 py-6">
                {/* shared PageHeader block (breadcrumb + title + live result count) for consistency */}
                <PageHeader
                    breadcrumb={(
                        <Breadcrumbs>
                            <Breadcrumbs.Item onPress={onNavigateHome}>
                                {t("nav.home")}
                            </Breadcrumbs.Item>
                            <Breadcrumbs.Item>
                                {t("nav.courses")}
                            </Breadcrumbs.Item>
                        </Breadcrumbs>
                    )}
                    title={t("courses.featuredTitle")}
                    description={count > 0 ? t("courses.count", { count }) : undefined}
                />

                {/* server-side search: filters the catalog (debounced), left-aligned */}
                <SearchInput
                    value={query}
                    onValueChange={setQuery}
                    placeholder={t("courses.searchPlaceholder")}
                />

                <AsyncContent
                    isLoading={swr.isLoading && list.length === 0}
                    error={list.length === 0 ? swr.error : undefined}
                    errorContent={{
                        title: t("courses.loadError"),
                        onRetry: () => void swr.mutate(),
                        retryLabel: t("courses.retry"),
                    }}
                    isEmpty={!swr.isLoading && list.length === 0}
                    emptyContent={{ title: t("courses.empty") }}
                    skeleton={(
                        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <CourseCardSkeleton key={index} />
                            ))}
                        </div>
                    )}
                >
                    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {list.map((course) => (
                            <CatalogCourseCard key={course.id} course={course} />
                        ))}
                    </div>
                </AsyncContent>

                {totalPages > 1 ? (
                    <Pagination
                        aria-label={t("common.pagination.navAria")}
                        className="mt-2 justify-center"
                        size="sm"
                    >
                        <Pagination.Content className="flex flex-wrap justify-center gap-2">
                            <Pagination.Item>
                                <Pagination.Previous
                                    aria-label={t("common.pagination.previous")}
                                    isDisabled={currentPage <= 1}
                                    onPress={() => setPageNumber((prev) => Math.max(0, prev - 1))}
                                >
                                    <Pagination.PreviousIcon />
                                </Pagination.Previous>
                            </Pagination.Item>
                            {pageNumbers.map((pageNo) => (
                                <Pagination.Item key={pageNo}>
                                    <Pagination.Link
                                        isActive={pageNo === currentPage}
                                        onPress={() => setPageNumber(pageNo - 1)}
                                    >
                                        {pageNo}
                                    </Pagination.Link>
                                </Pagination.Item>
                            ))}
                            <Pagination.Item>
                                <Pagination.Next
                                    aria-label={t("common.pagination.next")}
                                    isDisabled={currentPage >= totalPages}
                                    onPress={() => setPageNumber((prev) => prev + 1)}
                                >
                                    <Pagination.NextIcon />
                                </Pagination.Next>
                            </Pagination.Item>
                        </Pagination.Content>
                    </Pagination>
                ) : null}
            </div>
        </div>
    )
}
