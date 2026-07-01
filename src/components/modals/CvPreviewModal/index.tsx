"use client"

import React, { useEffect, useMemo } from "react"
import { cn, Modal } from "@heroui/react"
import dynamic from "next/dynamic"
import { useTranslations } from "next-intl"
import { useCvPreviewOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useCvApplyStore } from "@/hooks/zustand/cvApply/store"
import { WithClassNames } from "@/modules/types/base/class-name"

const PDFView = dynamic(
    () => import("@/components/reuseable/PDFView").then((module) => module.PDFView),
    { ssr: false },
)

const REMOTE_TEST_PDF_URL = "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"

/** Props for {@link CvPreviewModal}. */
type CvPreviewModalProps = WithClassNames<undefined>

/**
 * Full-screen CV preview modal controlled by singleton overlay state.
 */
export const CvPreviewModal = ({ className }: CvPreviewModalProps = {}) => {
    const t = useTranslations()
    const cvFile = useCvApplyStore((state) => state.cvFile)
    const { isOpen, setOpen } = useCvPreviewOverlayState()
    const selectedFileUrl = useMemo(() => {
        if (!cvFile) return ""
        return URL.createObjectURL(cvFile)
    }, [cvFile])
    const previewPdfUrl = selectedFileUrl || REMOTE_TEST_PDF_URL

    useEffect(() => {
        return () => {
            if (selectedFileUrl) URL.revokeObjectURL(selectedFileUrl)
        }
    }, [selectedFileUrl])

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container className="h-[92vh] w-[96vw] max-w-[96vw]">
                    <Modal.Dialog className={cn(className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="font-semibold">{t("cv.preview.title")}</div>
                        </Modal.Header>
                        <Modal.Body className="p-2">
                            <PDFView
                                src={previewPdfUrl}
                                title={t("cv.preview.title")}
                                heightClassName="h-[84vh]"
                                pageWidth={900}
                                showAllPages={true}
                                allowVerticalScroll={true}
                            />
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
