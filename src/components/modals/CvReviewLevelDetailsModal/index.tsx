"use client"

import React, {
    useMemo,
} from "react"
import {
    Button,
    cn,
    Modal,
} from "@heroui/react"
import {
    useTranslations,
} from "next-intl"
import { useCvReviewLevelDetailsOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { setSelectedCvReviewTemplateId } from "@/redux/slices/cv-review-level"
import { WithClassNames } from "@/modules/types/base/class-name"

/**
 * One selectable CV rubric template row in the modal.
 */
interface CvReviewLevelOption {
    /** `template_cvs.id`. */
    id: string
    /** Template title shown to the learner. */
    title: string
    /** Template description shown under the title. */
    description?: string | null
}

/** Props for {@link CvReviewLevelDetailsModal}. */
type CvReviewLevelDetailsModalProps = WithClassNames<undefined>

/**
 * Lets the learner choose a CV review level from template title and description.
 */
export const CvReviewLevelDetailsModal = ({ className }: CvReviewLevelDetailsModalProps = {}) => {
    const {
        isOpen,
        setOpen,
    } = useCvReviewLevelDetailsOverlayState()
    const dispatch = useAppDispatch()
    const selectedTemplateId = useAppSelector((state) => state.cvReviewLevel.selectedTemplateId)
    const templateCvsRows = useAppSelector((state) => state.templateCvs.rows)
    const t = useTranslations()

    const reviewLevelOptions = useMemo<Array<CvReviewLevelOption>>(
        () =>
            templateCvsRows.map((row) => ({
                id: row.id,
                title: row.title,
                description: row.description,
            })),
        [
            templateCvsRows,
        ],
    )

    const handleSelectReviewLevel = (templateId: string) => {
        dispatch(setSelectedCvReviewTemplateId(templateId))
        setOpen(false)
    }

    const optionElements = useMemo(
        () => reviewLevelOptions.map((option) => {
            const isSelected = option.id === selectedTemplateId
            const description = option.description?.trim() || t("cv.submission.reviewLevelDetails.emptyDescription")

            return (
                <button
                    key={option.id}
                    type="button"
                    className={[
                        "rounded-2xl border p-4 text-left transition hover:border-accent hover:bg-accent/5",
                        isSelected ? "border-accent bg-accent/10" : "border-divider/70 bg-content1",
                    ].join(" ")}
                    onClick={() => handleSelectReviewLevel(option.id)}
                >
                    <div className="flex items-start justify-between gap-1.5">
                        <div className="font-semibold text-foreground">
                            {option.title}
                        </div>
                        {isSelected && (
                            <div className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                                {t("cv.submission.reviewLevelDetails.selected")}
                            </div>
                        )}
                    </div>
                    <div className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                        {description}
                    </div>
                </button>
            )
        }),
        [
            dispatch,
            reviewLevelOptions,
            selectedTemplateId,
            setOpen,
            t,
        ],
    )

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={setOpen}
        >
            <Modal.Backdrop>
                <Modal.Container size="md">
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="text-base font-semibold">
                                {t("cv.submission.reviewLevelDetails.selectionTitle")}
                            </div>
                            <div className="text-xs text-muted">
                                {t("cv.submission.reviewLevelDetails.subtitle")}
                            </div>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-6">
                            <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
                                {optionElements}
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    variant="primary"
                                    onPress={() => setOpen(false)}
                                >
                                    {t("cv.submission.reviewLevelDetails.close")}
                                </Button>
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
