"use client"

import React, { useMemo } from "react"
import { Pagination, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { ChallengeCard } from "./ChallengeCard"
import { ChallengeCardSkeleton } from "./ChallengeCardSkeleton"
import _ from "lodash"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { WithClassNames } from "@/modules/types/base/class-name"
import { AsyncContent } from "@/components/blocks/async/AsyncContent"
import { LabeledCard } from "@/components/blocks/cards/LabeledCard"
import { useQueryChallengesSwr } from "@/hooks/swr/api/graphql/queries/useQueryChallengesSwr"
import { setChallengePageNumber } from "@/redux/slices/challenge"

export type ChallengeBodyProps = WithClassNames<undefined>

export const ChallengeBody = ({ className }: ChallengeBodyProps) => {
    const t = useTranslations()
    const dispatch = useAppDispatch()
    const queryChallengesSwr = useQueryChallengesSwr()
    const challenges = useAppSelector((state) => state.challenge.entities)
    const count = useAppSelector((state) => state.challenge.count)
    const limit = useAppSelector((state) => state.challenge.limit)
    const pageNumber = useAppSelector((state) => state.challenge.pageNumber)
    // gate on first-load only (NOT isValidating) — a background revalidate on page
    // change keeps the current cards on screen instead of flashing the skeleton
    const isLoading = queryChallengesSwr.isLoading
    // surface fetch failures (e.g. the FE↔BE schema drift that broke this tab) as a
    // distinct error+retry state instead of an indistinguishable "no challenges" empty
    const error = queryChallengesSwr.error
    const isEmpty = !isLoading && !error && !challenges?.length
    const pageSize = limit ?? 10
    const totalPages = useMemo(() => {
        if (count == null || count <= 0) {
            return 0
        }
        return Math.max(1, Math.ceil(count / pageSize))
    }, [count, pageSize])
    const pageNumbers = useMemo(
        () => Array.from({ length: totalPages }, (_, index) => index + 1),
        [totalPages],
    )
    const currentPage = pageNumber ?? 1

    return (
        <AsyncContent
            isLoading={isLoading}
            skeleton={(
                <div className={cn("flex flex-col gap-3", className)}>
                    <ChallengeCardSkeleton />
                    <ChallengeCardSkeleton />
                </div>
            )}
            isEmpty={isEmpty}
            emptyContent={{ title: t("challenge.empty") }}
            error={error}
            errorContent={{
                title: t("challenge.errorTitle"),
                description: t("challenge.errorDescription"),
                onRetry: () => queryChallengesSwr.mutate(),
                retryLabel: t("challenge.retry"),
            }}
        >
            <LabeledCard
                label={t("challenge.count", { count: count ?? 0 })}
                frameless
                className={className}
            >
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        {
                            _.cloneDeep(challenges)
                                ?.sort((prev, next) => prev.sortIndex - next.sortIndex)
                                .map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)
                        }
                    </div>
                    {count ? (
                        <Pagination
                            aria-label={t("common.pagination.navAria")}
                            className="justify-start"
                            size="sm"
                        >
                            <Pagination.Content className="flex flex-wrap justify-start gap-1">
                                <Pagination.Item>
                                    <Pagination.Previous
                                        aria-label={t("common.pagination.previous")}
                                        isDisabled={currentPage <= 1}
                                        onPress={() => dispatch(setChallengePageNumber(currentPage - 1))}
                                        className="cursor-pointer rounded-medium transition-colors hover:bg-default"
                                    >
                                        <Pagination.PreviousIcon />
                                    </Pagination.Previous>
                                </Pagination.Item>
                                {pageNumbers.map((pageNumber) => (
                                    <Pagination.Item key={pageNumber}>
                                        <Pagination.Link
                                            isActive={pageNumber === currentPage}
                                            onPress={() => dispatch(setChallengePageNumber(pageNumber))}
                                            className="cursor-pointer rounded-medium transition-colors hover:bg-default data-[active=true]:hover:bg-accent"
                                        >
                                            {pageNumber}
                                        </Pagination.Link>
                                    </Pagination.Item>
                                ))}
                                <Pagination.Item>
                                    <Pagination.Next
                                        aria-label={t("common.pagination.next")}
                                        isDisabled={currentPage >= totalPages}
                                        onPress={() => dispatch(setChallengePageNumber(currentPage + 1))}
                                        className="cursor-pointer rounded-medium transition-colors hover:bg-default"
                                    >
                                        <Pagination.NextIcon />
                                    </Pagination.Next>
                                </Pagination.Item>
                            </Pagination.Content>
                        </Pagination>
                    ) : null}
                </div>
            </LabeledCard>
        </AsyncContent>
    )
}
