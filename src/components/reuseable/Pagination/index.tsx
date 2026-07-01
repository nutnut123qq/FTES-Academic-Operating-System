"use client"

import React, { useCallback, useMemo } from "react"
import { Pagination as HeroPagination, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link Pagination}. */
export interface PaginationProps extends WithClassNames<undefined> {
    /** 1-based current page. */
    currentPage: number
    /** Total number of pages (>= 1). */
    totalPages: number
    /** Fired with a 1-based page number when the user changes page. */
    onPageChange: (pageNumber: number) => void
}

/**
 * Generic, reusable page-based pagination control.
 *
 * Presentational + controlled: renders page links + prev/next from the supplied
 * page state and delegates navigation via `onPageChange`. The parent owns paging
 * (client-side or server-driven), so this stays reusable across any list.
 *
 * @param props - {@link PaginationProps}
 */
export const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    className,
}: PaginationProps) => {
    const t = useTranslations()

    /** All 1-based page numbers to render (lists using this control are small). */
    const pageNumbers = useMemo(
        () => Array.from({ length: totalPages }, (_, index) => index + 1),
        [totalPages],
    )

    /** Go to the previous page, clamped to the first page. */
    const onPrevious = useCallback(
        () => onPageChange(Math.max(1, currentPage - 1)),
        [currentPage, onPageChange],
    )

    /** Go to the next page, clamped to the last page. */
    const onNext = useCallback(
        () => onPageChange(Math.min(totalPages, currentPage + 1)),
        [currentPage, totalPages, onPageChange],
    )

    return (
        <div className={cn("mt-6 flex justify-center", className)}>
            <HeroPagination aria-label={t("common.pagination.navAria")} size="sm">
                <HeroPagination.Content className="flex flex-wrap justify-center gap-1">
                    <HeroPagination.Item>
                        <HeroPagination.Previous
                            aria-label={t("common.pagination.previous")}
                            isDisabled={currentPage <= 1}
                            onPress={onPrevious}
                        >
                            <HeroPagination.PreviousIcon />
                        </HeroPagination.Previous>
                    </HeroPagination.Item>
                    {pageNumbers.map((pageNumber) => (
                        <PaginationLink
                            key={pageNumber}
                            pageNumber={pageNumber}
                            isActive={pageNumber === currentPage}
                            onPageChange={onPageChange}
                        />
                    ))}
                    <HeroPagination.Item>
                        <HeroPagination.Next
                            aria-label={t("common.pagination.next")}
                            isDisabled={currentPage >= totalPages}
                            onPress={onNext}
                        >
                            <HeroPagination.NextIcon />
                        </HeroPagination.Next>
                    </HeroPagination.Item>
                </HeroPagination.Content>
            </HeroPagination>
        </div>
    )
}

/** Props for {@link PaginationLink}. */
interface PaginationLinkProps {
    /** 1-based page number this link targets. */
    pageNumber: number
    /** Whether this link is the active page. */
    isActive: boolean
    /** Fired with this link's page number on press. */
    onPageChange: (pageNumber: number) => void
}

/**
 * A single page link; isolates its press handler so no inline arrow lives in the map.
 *
 * @param props - {@link PaginationLinkProps}
 */
const PaginationLink = ({
    pageNumber,
    isActive,
    onPageChange,
}: PaginationLinkProps) => {
    /** Navigate to this link's page. */
    const onPress = useCallback(
        () => onPageChange(pageNumber),
        [pageNumber, onPageChange],
    )
    return (
        <HeroPagination.Item>
            <HeroPagination.Link isActive={isActive} onPress={onPress}>
                {pageNumber}
            </HeroPagination.Link>
        </HeroPagination.Item>
    )
}
