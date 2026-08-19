"use client"

import React, { useEffect, useState } from "react"
import {
    Button,
    Modal,
    TextArea,
    TextField,
    Typography,
} from "@heroui/react"
import { useTranslations } from "next-intl"
import { SelectableCardGroup } from "@/components/blocks/navigation/SelectableCardGroup"
import { REPORT_REASON_CODES, type ReportReasonCode } from "./report-reasons"

/** Props for {@link ReportDialog}. */
export interface ReportDialogProps {
    /** Whether the dialog is open. */
    isOpen: boolean
    /** Close the dialog (backdrop / Esc / cancel). */
    onClose: () => void
    /**
     * Send the report. Resolve `true` on success (the dialog resets + closes) and
     * `false` on failure / blocked guest (the draft is kept so the reporter can
     * retry). The caller owns the auth guard, the toasts and the API call.
     */
    onSubmit: (reasonCode: ReportReasonCode, detail?: string) => Promise<boolean>
}

/** Detail free-text cap — the BE column is text but a report is not an essay. */
const DETAIL_MAX_LENGTH = 500

/**
 * Report-content dialog: a required reason code (the five values the BE accepts,
 * see {@link REPORT_REASON_CODES}) plus an optional free-text detail. Used by the
 * post ⋯ menu and reusable for any other reportable target.
 *
 * Opening the dialog resets the draft, so a previously failed report never leaks
 * into the next one.
 *
 * @param props - {@link ReportDialogProps}
 */
export const ReportDialog = ({ isOpen, onClose, onSubmit }: ReportDialogProps) => {
    const t = useTranslations("communityHub")
    const [reason, setReason] = useState<ReportReasonCode>("SPAM")
    const [detail, setDetail] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setReason("SPAM")
            setDetail("")
            setIsSubmitting(false)
        }
    }, [isOpen])

    const submit = async () => {
        if (isSubmitting) {
            return
        }
        setIsSubmitting(true)
        const trimmed = detail.trim()
        const ok = await onSubmit(reason, trimmed.length > 0 ? trimmed : undefined)
        setIsSubmitting(false)
        if (ok) {
            onClose()
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    onClose()
                }
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-md">
                        <Modal.Header>
                            <Typography type="body" weight="bold">
                                {t("engagement.reportTitle")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-4">
                            <Typography type="body-sm" color="muted">
                                {t("engagement.reportDescription")}
                            </Typography>
                            {/* Block `SelectableCardGroup`, KHÔNG phải `<Radio>` trần (góp ý
                                #12). `Radio` của nhà không tự vẽ nút chọn — nó giao trạng
                                thái `isSelected` cho caller qua render-prop (xem mọi chỗ
                                dùng đúng trong repo). Truyền vào một chuỗi trần thì ra đúng
                                năm dòng chữ không dấu hiệu gì, và người báo cáo không biết
                                mình đã chọn cái nào hay có chọn được không. */}
                            <SelectableCardGroup<ReportReasonCode>
                                ariaLabel={t("engagement.reportReasonLabel")}
                                variant="list"
                                value={reason}
                                onChange={setReason}
                                items={REPORT_REASON_CODES.map((code) => ({
                                    value: code,
                                    label: t(`engagement.reportReasons.${code}`),
                                }))}
                            />
                            <div className="flex flex-col gap-2">
                                <Typography type="body-sm" weight="medium">
                                    {t("engagement.reportDetailLabel")}
                                </Typography>
                                <TextField variant="secondary" className="w-full">
                                    <TextArea
                                        rows={3}
                                        value={detail}
                                        maxLength={DETAIL_MAX_LENGTH}
                                        onChange={(event) => setDetail(event.target.value)}
                                        placeholder={t("engagement.reportDetailPlaceholder")}
                                        aria-label={t("engagement.reportDetailLabel")}
                                        className="resize-none"
                                        disabled={isSubmitting}
                                    />
                                </TextField>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="justify-end gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onPress={onClose}
                                isDisabled={isSubmitting}
                            >
                                {t("engagement.cancel")}
                            </Button>
                            <Button
                                size="sm"
                                variant="primary"
                                onPress={() => void submit()}
                                isPending={isSubmitting}
                                isDisabled={isSubmitting}
                            >
                                {t("engagement.reportSubmit")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
