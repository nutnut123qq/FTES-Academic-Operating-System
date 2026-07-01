"use client"

import React from "react"
import { Button, cn, Modal } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useCvUpdateOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useCvApplyForm } from "@/hooks/zustand/cvApply/useCvApplyForm"
import { Dropzone } from "@/components/reuseable/Dropzone"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Props for {@link CvUpdateModal}.
 */
export type CvUpdateModalProps = WithClassNames<undefined>

/**
 * Modal to upload/replace the applicant CV file.
 *
 * @param props - Optional styling props.
 */
export const CvUpdateModal = (props: CvUpdateModalProps) => {
    const { className } = props
    const { isOpen, setOpen } = useCvUpdateOverlayState()
    // cvFile is shared via the zustand store so CVUpload/CVPreview see the same file.
    const { cvFile, setCvFile, error, submit, isSubmitting } = useCvApplyForm()
    const t = useTranslations()
    const handleConfirmSubmission = async () => {
        if (!cvFile || error) {
            return
        }
        await submit()
        setOpen(false)
    }

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container size="sm">
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="text-base font-semibold">
                                {t("cv.form.modal.title")}
                            </div>
                            <div className="text-xs text-muted">
                                {t("cv.form.modal.description")}
                            </div>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-6">
                            <Dropzone
                                hint={t("cv.form.cvFile.hint")}
                                file={cvFile}
                                errorMessage={
                                    cvFile && error
                                        ? t(error)
                                        : undefined
                                }
                                acceptedMimeTypes={["application/pdf"]}
                                maxSizeInBytes={10 * 1024 * 1024}
                                onChange={(file) => setCvFile(file)}
                            />
                            <div className="flex items-center justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onPress={() => {
                                        setCvFile(null)
                                        setOpen(false)
                                    }}
                                >
                                    {t("cv.form.cancel")}
                                </Button>
                                <Button
                                    variant="primary"
                                    isDisabled={isSubmitting}
                                    onPress={handleConfirmSubmission}
                                >
                                    {t("cv.form.modal.confirm")}
                                </Button>
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
