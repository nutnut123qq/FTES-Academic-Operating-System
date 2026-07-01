"use client"

import React, { useMemo } from "react"
import { cn, Drawer, Pagination, ScrollShadow } from "@heroui/react"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { useTranslations } from "next-intl"
import { SubmissionAttemptCard } from "./SubmissionAttemptCard"
import { SubmissionAttemptCardSkeleton } from "./SubmissionAttempCardSkeleton"
import { Empty } from "./Empty"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useSubmissionAttemptsOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setActiveChallengeSubmissionId, setSubmissionAttemptsPageNumber } from "@/redux/slices/submission-attempt"
import { useQuerySubmissionAttemptsSwr } from "@/hooks/swr/api/graphql/queries/useQuerySubmissionAttemptsSwr"

/** Props for {@link SubmissionAttemptsDrawer}. Container — only layout className. */
export type SubmissionAttemptsDrawerProps = WithClassNames<undefined>

/**
 * Drawer listing submission attempts for the active challenge submission.
 */
export const SubmissionAttemptsDrawer = (props: SubmissionAttemptsDrawerProps = {}) => {
    const { className } = props
    const dispatch = useAppDispatch()
    const t = useTranslations()
    const { isOpen, setOpen } = useSubmissionAttemptsOverlayState()
    const { isMobile } = useSmViewpoint()
    const submissionAttempts = useAppSelector((state) => state.submissionAttempt.submissionAttempts)
    const count = useAppSelector((state) => state.submissionAttempt.count)
    const pageNumber = useAppSelector((state) => state.submissionAttempt.pageNumber)
    const limit = useAppSelector((state) => state.submissionAttempt.limit)
    const activeChallengeSubmissionId = useAppSelector(
        (state) => state.submissionAttempt.activeChallengeSubmissionId,
    )
    const challengeSubmissions = useAppSelector((state) => state.challenge.challengeSubmissions)
    const challengeSubmission = useMemo(
        () => challengeSubmissions?.find(
            (challengeSubmission) => challengeSubmission.id === activeChallengeSubmissionId,
        ),
        [challengeSubmissions, activeChallengeSubmissionId],
    )
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
    const swr = useQuerySubmissionAttemptsSwr()
    const showSkeleton =
        isOpen
        && swr.isLoading
        && submissionAttempts.length === 0
    return (
        <Drawer>
            <Drawer.Backdrop
                isOpen={isOpen}
                onOpenChange={(open) => {
                    setOpen(open)
                    if (!open) {
                        dispatch(setActiveChallengeSubmissionId(undefined))
                    }
                }}
            >
                <Drawer.Content placement={isMobile ? "bottom" : "right"}>
                    <Drawer.Dialog className={cn("p-0", className)}>
                        <div className="p-3">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                <Drawer.Heading>
                                    {t("submissionAttempts.title")}
                                </Drawer.Heading>
                            </Drawer.Header>
                        </div>
                        <Drawer.Body>
                            {
                                showSkeleton ? (
                                    <ScrollShadow className="h-full p-3" hideScrollBar>
                                        <div className="flex flex-col gap-3">
                                            {Array.from({ length: 3 }).map((_, index) => (
                                                <SubmissionAttemptCardSkeleton key={index} />
                                            ))}
                                        </div>
                                    </ScrollShadow>
                                ) : 
                                    submissionAttempts.length ? (
                                        <ScrollShadow className="h-full p-3" hideScrollBar>
                                            <div className="flex flex-col gap-3">
                                                {
                                                    submissionAttempts.map(
                                                        (submissionAttempt) => (
                                                            <SubmissionAttemptCard
                                                                key={submissionAttempt.id}
                                                                maxScore={challengeSubmission?.score}
                                                                submissionAttempt={submissionAttempt}
                                                            />
                                                        ),
                                                    )
                                                }
                                            </div>
                                        </ScrollShadow>
                                    ) : (
                                        <Empty />
                                    )
                            }
                        </Drawer.Body>
                        {count ? (
                            <Drawer.Footer className="border-t  h-[52px]">
                                <Pagination
                                    aria-label={t("common.pagination.navAria")}
                                    className="justify-center"
                                    size="sm"
                                >
                                    <Pagination.Content className="flex flex-wrap justify-center gap-1.5">
                                        <Pagination.Item>
                                            <Pagination.Previous
                                                aria-label={t("common.pagination.previous")}
                                                isDisabled={currentPage <= 1}
                                                onPress={() => dispatch(setSubmissionAttemptsPageNumber(currentPage - 1))}
                                            >
                                                <Pagination.PreviousIcon />
                                            </Pagination.Previous>
                                        </Pagination.Item>
                                        {pageNumbers.map((pageNumber) => (
                                            <Pagination.Item key={pageNumber}>
                                                <Pagination.Link
                                                    isActive={pageNumber === currentPage}
                                                    onPress={() => dispatch(setSubmissionAttemptsPageNumber(pageNumber))}
                                                >
                                                    {pageNumber}
                                                </Pagination.Link>
                                            </Pagination.Item>
                                        ))}
                                        <Pagination.Item>
                                            <Pagination.Next
                                                aria-label={t("common.pagination.next")}
                                                isDisabled={currentPage >= totalPages}
                                                onPress={() => dispatch(setSubmissionAttemptsPageNumber(currentPage + 1))}
                                            >
                                                <Pagination.NextIcon />
                                            </Pagination.Next>
                                        </Pagination.Item>
                                    </Pagination.Content>
                                </Pagination>
                            </Drawer.Footer>
                        ) : null}
                    </Drawer.Dialog>
                </Drawer.Content>
            </Drawer.Backdrop>
        </Drawer>
    )
}
