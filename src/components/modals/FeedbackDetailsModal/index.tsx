"use client"

import React, { useMemo } from "react"
import { cn, Modal, ScrollShadow } from "@heroui/react"
import { FeedbackCard } from "./FeedbackCard"
import { useTranslations } from "next-intl"
import { FeedbackDetailsEmpty } from "./Empty"
import { FeedbackCardSkeleton } from "./FeedbackCardSkeleton"
import { useFeedbackDetailsOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useQuerySubmissionFeedbacksSwr } from "@/hooks/swr/api/graphql/queries/useQuerySubmissionFeedbacksSwr"
import { useAppSelector } from "@/redux/hooks"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link FeedbackDetailsModal}.
 */
export type FeedbackDetailsModalProps = WithClassNames<undefined>

/**
 * Modal listing feedback entries for the current submission attempt.
 *
 * @param props - Optional styling props.
 */
export const FeedbackDetailsModal = (props: FeedbackDetailsModalProps) => {
    const { className } = props
    const { isOpen, setOpen } = useFeedbackDetailsOverlayState()
    const querySubmissionFeedbacksSwr = useQuerySubmissionFeedbacksSwr()
    const submissionFeedbacks = useAppSelector((state) => state.submissionFeedback.submissionFeedbacks)
    const submissionAttemptId = useAppSelector((state) => state.submissionAttempt.id)
    const submissionAttempts = useAppSelector((state) => state.submissionAttempt.submissionAttempts)
    const repositoryUrl = useMemo(
        () => submissionAttempts.find((attempt) => attempt.id === submissionAttemptId)?.submissionUrl,
        [submissionAttempts, submissionAttemptId],
    )
    const t = useTranslations()
    const showSkeleton =
        isOpen
        && (querySubmissionFeedbacksSwr.isLoading)
        && submissionFeedbacks.length === 0
    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container size="lg">
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="text-lg font-bold">{t("feedback.detailsTitle")}</div>
                        </Modal.Header>
                        <Modal.Body>
                            {showSkeleton ? (
                                <ScrollShadow className="max-h-[500px]" hideScrollBar>
                                    <div className="flex flex-col gap-3 p-3">
                                        {
                                            Array.from({ length: 3 }).map((_, index) => (
                                                <FeedbackCardSkeleton key={index} />
                                            ))
                                        }
                                    </div>
                                </ScrollShadow>
                            ) : submissionFeedbacks.length ? (
                                <ScrollShadow className="max-h-[500px]" hideScrollBar>
                                    <div className="flex flex-col gap-3">
                                        {submissionFeedbacks.map((submissionFeedback) => (
                                            <FeedbackCard
                                                key={submissionFeedback.id}
                                                repositoryUrl={repositoryUrl}
                                                submissionFeedback={submissionFeedback}
                                            />
                                        ))}
                                    </div>
                                </ScrollShadow>
                            ) : (
                                <FeedbackDetailsEmpty />
                            )}
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
