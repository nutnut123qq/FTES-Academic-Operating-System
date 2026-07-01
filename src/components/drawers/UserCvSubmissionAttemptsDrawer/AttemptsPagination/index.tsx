"use client"

import React, { useCallback, useMemo } from "react"
import {
    cn,
    Pagination,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import { MAX_VISIBLE_PAGES } from "../constants"
import { useQueryUserCvSubmissionAttemptsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCvSubmissionAttemptsSwr"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link AttemptsPagination}. Container — only layout className. */
export type AttemptsPaginationProps = WithClassNames<undefined>

/**
 * Pagination control for the attempts drawer.
 *
 * Self-reads page state from {@link useQueryUserCvSubmissionAttemptsSwr}.
 * @param props - Optional className.
 */
export const AttemptsPagination = (props: AttemptsPaginationProps = {}) => {
    const { className } = props
    const t = useTranslations()
    const swr = useQueryUserCvSubmissionAttemptsSwr()
    const payload = swr.data

    /** Total visible pages, capped at {@link MAX_VISIBLE_PAGES}. */
    const totalPages = useMemo(
        () => Math.min(
            Math.max(1, Math.ceil((payload?.totalCount ?? 0) / swr.pageSize)),
            MAX_VISIBLE_PAGES,
        ),
        [payload?.totalCount, swr.pageSize],
    )

    /** 1-based current page, clamped to the visible range. */
    const currentPage = Math.min(swr.pageNumber + 1, totalPages)

    /** 1-based page numbers rendered as pagination links. */
    const pageNumbers = useMemo<Array<number>>(
        () => Array.from({ length: totalPages }, (_, index) => index + 1),
        [totalPages],
    )

    /** Navigate to a specific 1-based page. */
    const onPageChange = useCallback(
        (pageNumber: number) => swr.setPageNumber(pageNumber - 1),
        [swr],
    )

    /** Navigate to the previous page. */
    const onPrevious = useCallback(
        () => swr.setPageNumber(currentPage - 2),
        [swr, currentPage],
    )

    /** Navigate to the next page. */
    const onNext = useCallback(
        () => swr.setPageNumber(currentPage),
        [swr, currentPage],
    )

    return (
        <div className={cn("shrink-0 border-t bg-content1 px-3 py-3", className)}>
            <Pagination
                aria-label={t("common.pagination.navAria")}
                className="w-full justify-center"
                size="sm"
            >
                <Pagination.Content className="flex flex-wrap justify-center gap-1.5">
                    <Pagination.Item>
                        <Pagination.Previous
                            aria-label={t("common.pagination.previous")}
                            isDisabled={currentPage <= 1}
                            onPress={onPrevious}
                        >
                            <Pagination.PreviousIcon />
                        </Pagination.Previous>
                    </Pagination.Item>
                    {pageNumbers.map((pageNumber) => (
                        <AttemptsPaginationLink
                            key={pageNumber}
                            pageNumber={pageNumber}
                            isActive={pageNumber === currentPage}
                            onPageChange={onPageChange}
                        />
                    ))}
                    <Pagination.Item>
                        <Pagination.Next
                            aria-label={t("common.pagination.next")}
                            isDisabled={currentPage >= totalPages}
                            onPress={onNext}
                        >
                            <Pagination.NextIcon />
                        </Pagination.Next>
                    </Pagination.Item>
                </Pagination.Content>
            </Pagination>
        </div>
    )
}

/** Props for {@link AttemptsPaginationLink}. */
interface AttemptsPaginationLinkProps {
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
 * @param props - {@link AttemptsPaginationLinkProps}
 */
const AttemptsPaginationLink = ({
    pageNumber,
    isActive,
    onPageChange,
}: AttemptsPaginationLinkProps) => {
    /** Navigate to this link's page. */
    const onPress = React.useCallback(
        () => onPageChange(pageNumber),
        [
            pageNumber,
            onPageChange,
        ],
    )
    return (
        <Pagination.Item>
            <Pagination.Link
                isActive={isActive}
                onPress={onPress}
            >
                {pageNumber}
            </Pagination.Link>
        </Pagination.Item>
    )
}
