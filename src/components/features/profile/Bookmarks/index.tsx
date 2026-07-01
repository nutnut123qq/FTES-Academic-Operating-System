"use client"

import React, {
    useEffect,
    useState,
} from "react"
import {
    Input,
    Pagination,
    TextField,
    Typography,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import {
    SettingsBreadcrumb,
} from "../Settings/SettingsBreadcrumb"
import {
    BookmarkCard,
} from "./BookmarkCard"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { EmptyContent } from "@/components/blocks/async/EmptyContent"
import { PageHeader } from "@/components/blocks/layout/PageHeader"
import { Skeleton } from "@/components/blocks/skeleton/Skeleton"
import { SurfaceListCard } from "@/components/blocks/cards/SurfaceListCard"
import { SAVED_CONTENTS_PAGE_SIZE, useQuerySavedContentsSwr } from "@/hooks/swr/api/graphql/queries/useQuerySavedContentsSwr"

/**
 * Bookmark page — a searchable, paginated library of the viewer's saved contents.
 * Follows the list-surface anatomy: a primary search input balanced by the result
 * count, one {@link SurfaceListCard} of saved-lesson rows, and a left-aligned
 * {@link Pagination} (hidden on a single page). Search + paging are resolved
 * server-side (`savedContents(skip, take, search)`); typing snaps back to page 1.
 * Data states go through {@link AsyncContent}. Mounted by `/profile/bookmarks`.
 */
export const Bookmarks = () => {
    const t = useTranslations()

    // search input (debounced → server-side title filter) + 1-based page
    const [search, setSearch] = useState("")
    const [debounced, setDebounced] = useState("")
    const [page, setPage] = useState(1)

    // debounce keystrokes before hitting the server
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(search.trim()), 300)
        return () => clearTimeout(timer)
    }, [search])

    // a new search shrinks the list — snap back to the first page
    useEffect(() => {
        setPage(1)
    }, [debounced])

    const {
        data,
        isLoading,
        error,
        mutate,
    } = useQuerySavedContentsSwr(page, debounced)

    const contents = data?.contents ?? []
    const count = data?.count ?? 0
    const totalPages = Math.ceil(count / SAVED_CONTENTS_PAGE_SIZE)
    const pageNumbers = Array.from({ length: totalPages }, (_unused, index) => index + 1)

    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-10 p-6">
            <PageHeader
                breadcrumb={<SettingsBreadcrumb current={t("bookmarks.heading")} />}
                title={t("bookmarks.heading")}
                description={t("bookmarks.subtitle")}
            />
            <AsyncContent
                isLoading={isLoading && !data}
                skeleton={(
                    <SurfaceListCard>
                        {[0, 1, 2, 3, 4].map((row) => (
                            <div key={row} className="flex items-center gap-3 px-4 py-4">
                                <Skeleton className="size-12 shrink-0 rounded-xl" />
                                <div className="flex flex-1 flex-col gap-2">
                                    <Skeleton className="h-4 w-1/2 rounded-medium" />
                                    <Skeleton className="h-3 w-1/3 rounded-medium" />
                                </div>
                            </div>
                        ))}
                    </SurfaceListCard>
                )}
                isEmpty={!debounced && count === 0}
                emptyContent={{
                    title: t("bookmarks.empty"),
                    description: t("bookmarks.emptyHint"),
                }}
                error={error}
                errorContent={{
                    title: t("bookmarks.errorTitle"),
                    onRetry: () => { void mutate() },
                    retryLabel: t("dashboard.retry"),
                }}
            >
                <div className="flex flex-col gap-3">
                    {/* search row: primary input (left, on the page background → no
                        variant) balanced by the result count (right) */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <TextField className="w-full sm:max-w-sm">
                            <Input
                                type="search"
                                aria-label={t("bookmarks.searchPlaceholder")}
                                placeholder={t("bookmarks.searchPlaceholder")}
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </TextField>
                        <Typography type="body-sm" color="muted" className="shrink-0">
                            {t("bookmarks.found", { count })}
                        </Typography>
                    </div>

                    {contents.length === 0 ? (
                        <EmptyContent title={t("bookmarks.noMatch")} />
                    ) : (
                        <>
                            <SurfaceListCard>
                                {contents.map((content) => (
                                    <BookmarkCard key={content.id} content={content} />
                                ))}
                            </SurfaceListCard>

                            {/* pager: left-aligned with the list, hidden on a single
                                page. HeroUI Pagination bakes no hover/cursor → add per
                                the rule. */}
                            {totalPages > 1 ? (
                                <Pagination
                                    aria-label={t("common.pagination.navAria")}
                                    className="justify-start"
                                    size="sm"
                                >
                                    <Pagination.Content className="flex flex-wrap justify-start gap-1.5">
                                        <Pagination.Item>
                                            <Pagination.Previous
                                                aria-label={t("common.pagination.previous")}
                                                isDisabled={page <= 1}
                                                className="cursor-pointer rounded-medium transition-colors hover:bg-default"
                                                onPress={() => setPage((current) => Math.max(1, current - 1))}
                                            >
                                                <Pagination.PreviousIcon />
                                            </Pagination.Previous>
                                        </Pagination.Item>
                                        {pageNumbers.map((pageNumber) => (
                                            <Pagination.Item key={pageNumber}>
                                                <Pagination.Link
                                                    isActive={pageNumber === page}
                                                    className="cursor-pointer rounded-medium transition-colors hover:bg-default data-[active=true]:hover:bg-accent"
                                                    onPress={() => setPage(pageNumber)}
                                                >
                                                    {pageNumber}
                                                </Pagination.Link>
                                            </Pagination.Item>
                                        ))}
                                        <Pagination.Item>
                                            <Pagination.Next
                                                aria-label={t("common.pagination.next")}
                                                isDisabled={page >= totalPages}
                                                className="cursor-pointer rounded-medium transition-colors hover:bg-default"
                                                onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
                                            >
                                                <Pagination.NextIcon />
                                            </Pagination.Next>
                                        </Pagination.Item>
                                    </Pagination.Content>
                                </Pagination>
                            ) : null}
                        </>
                    )}
                </div>
            </AsyncContent>
        </div>
    )
}
