"use client"

import React, {
    useEffect,
    useMemo,
} from "react"
import {
    ArrowLeftIcon,
} from "@phosphor-icons/react"
import {
    cn,
    Drawer,
    Link,
} from "@heroui/react"
import { useSmViewpoint } from "@/hooks/reuseables/useSmViewpoint"
import { dayjs } from "@/modules/dayjs"
import {
    useLocale,
    useTranslations,
} from "next-intl"
import type {
    AttemptRow,
} from "./types"
import {
    FEEDBACK_PREVIEW_MAX,
    MAX_VISIBLE_PAGES,
} from "./constants"
import {
    isPublicUrl,
} from "./utils"
import {
    AttemptsSkeleton,
} from "./AttemptsSkeleton"
import {
    AttemptsList,
} from "./AttemptsList"
import {
    AttemptsPagination,
} from "./AttemptsPagination"
import {
    CvAttemptAnalysisView,
} from "./CvAttemptAnalysisView"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { useCvSubmissionAttemptsDrawerOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQueryUserCvSubmissionAttemptsSwr } from "@/hooks/swr/api/graphql/queries/useQueryUserCvSubmissionAttemptsSwr"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { clearSelectedCvSubmissionAttemptAnalysis } from "@/redux/slices/cv-submission-attempt-analysis"
import { getFileNameFromUrl } from "@/utils/filename"

/** Props for {@link UserCvSubmissionAttemptsDrawer}. Container — only layout className. */
export type UserCvSubmissionAttemptsDrawerProps = WithClassNames<undefined>

/**
 * Drawer listing a user's CV submission attempts with server pagination, plus an in-drawer
 * master-detail: tapping an attempt swaps the list for its full AI analysis
 * ({@link CvAttemptAnalysisView}) with a back link — instead of opening a modal over the drawer.
 *
 * Container: owns SWR/overlay state and derives display rows; renders presentational children
 * (skeleton / list / pagination / analysis). Desktop = right drawer, mobile = bottom-sheet.
 */
export const UserCvSubmissionAttemptsDrawer = (props: UserCvSubmissionAttemptsDrawerProps = {}) => {
    const { className } = props
    const t = useTranslations()
    const locale = useLocale()
    const dispatch = useAppDispatch()
    const {
        isOpen,
        setOpen,
    } = useCvSubmissionAttemptsDrawerOverlayState()
    const { isMobile } = useSmViewpoint()
    const selectedAttempt = useAppSelector(
        (state) => state.cvSubmissionAttemptAnalysis.selectedAttempt,
    )
    const swr = useQueryUserCvSubmissionAttemptsSwr()
    const payload = swr.data
    const attemptList = payload?.data
    const dayjsLocale = locale.startsWith("vi") ? "vi" : "en"

    /** API attempts mapped into display-ready rows. */
    const rows = useMemo<Array<AttemptRow>>(
        () => (attemptList ?? []).map((attempt) => {
            const raw = attempt.submittedAt
            const d = dayjs(raw)
            const submittedAtLabel = d.isValid()
                ? d.locale(dayjsLocale).format("HH:mm, D MMMM YYYY")
                : t("cv.submission.submittedAtPending")
            const detail = attempt.detailFeedback?.trim() ?? ""
            const feedbackPreview = detail.length > FEEDBACK_PREVIEW_MAX
                ? `${detail.slice(0, FEEDBACK_PREVIEW_MAX)}…`
                : detail
            const fileLabel = getFileNameFromUrl(attempt.fileKey) || attempt.fileKey
            return {
                key: attempt.attemptId,
                attemptNumber: attempt.attemptNumber,
                fileLabel,
                fileUrl: attempt.fileUrl,
                fileUrlIsPublic: isPublicUrl(attempt.fileUrl),
                submittedAtLabel,
                status: attempt.status,
                feedbackPreview: feedbackPreview || t("cv.submission.attemptsDrawer.feedbackEmpty"),
                detailFeedback: detail,
            }
        }),
        [
            attemptList,
            dayjsLocale,
            t,
        ],
    )

    /** Number of page buttons to render, capped at {@link MAX_VISIBLE_PAGES}. */
    const totalPages = useMemo(
        () => Math.min(
            Math.max(1, Math.ceil((payload?.totalCount ?? 0) / swr.pageSize)),
            MAX_VISIBLE_PAGES,
        ),
        [
            payload?.totalCount,
            swr.pageSize,
        ],
    )

    useEffect(
        () => {
            if (swr.pageNumber + 1 <= totalPages) {
                return
            }
            swr.setPageNumber(totalPages - 1)
        },
        [
            swr,
            totalPages,
        ],
    )

    /** Whether to show the loading skeleton instead of content. */
    const showSkeleton = isOpen && swr.isLoading && !(attemptList?.length) && !swr.error

    /** Back from the analysis detail to the attempts list. */
    const onBackToList = () => dispatch(clearSelectedCvSubmissionAttemptAnalysis())

    /** Avoid mounting a closed drawer (backdrop / scroll-lock layers) on every page. */
    if (!isOpen) {
        return null
    }

    return (
        <Drawer>
            <Drawer.Backdrop
                isOpen
                onOpenChange={(open) => {
                    setOpen(open)
                    // closing resets the master-detail back to the list for the next open
                    if (!open) {
                        dispatch(clearSelectedCvSubmissionAttemptAnalysis())
                    }
                }}
            >
                <Drawer.Content placement={isMobile ? "bottom" : "right"}>
                    <Drawer.Dialog className={cn("flex h-full flex-col p-0", className)}>
                        <div className="shrink-0 p-3">
                            <Drawer.CloseTrigger />
                            <Drawer.Header>
                                {selectedAttempt ? (
                                    <div className="flex flex-col gap-1.5">
                                        <Link
                                            onPress={onBackToList}
                                            className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent"
                                        >
                                            <ArrowLeftIcon aria-hidden className="size-5" />
                                            {t("cv.submission.attemptsDrawer.title")}
                                        </Link>
                                        <Drawer.Heading>
                                            {t("cv.submission.attemptAnalysis.titleWithAttempt", {
                                                number: selectedAttempt.attemptNumber,
                                            })}
                                        </Drawer.Heading>
                                    </div>
                                ) : (
                                    <Drawer.Heading>
                                        {t("cv.submission.attemptsDrawer.title")}
                                    </Drawer.Heading>
                                )}
                            </Drawer.Header>
                        </div>
                        <Drawer.Body className="flex min-h-0 flex-1 flex-col">
                            {
                                selectedAttempt ? (
                                    <CvAttemptAnalysisView />
                                ) : swr.error ? (
                                    <div className="p-3 text-sm text-danger">
                                        {t("cv.submission.attemptsDrawer.loadError")}
                                    </div>
                                ) : showSkeleton ? (
                                    <AttemptsSkeleton />
                                ) : rows.length ? (
                                    <>
                                        <AttemptsList rows={rows} />
                                        <AttemptsPagination />
                                    </>
                                ) : (
                                    <div className="p-6 text-center text-sm text-muted">
                                        {t("cv.submission.attemptsDrawer.empty")}
                                    </div>
                                )
                            }
                        </Drawer.Body>
                    </Drawer.Dialog>
                </Drawer.Content>
            </Drawer.Backdrop>
        </Drawer>
    )
}
