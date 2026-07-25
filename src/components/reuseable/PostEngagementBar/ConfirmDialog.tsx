"use client"

import React from "react"
import { Button, Modal, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Props for {@link ConfirmDialog}. */
export interface ConfirmDialogProps {
    /** Whether the dialog is open. */
    isOpen: boolean
    /** Close without confirming (backdrop, Esc, or the cancel button). */
    onClose: () => void
    /** Run the destructive action; the caller closes the dialog when it settles. */
    onConfirm: () => void
    /** Dialog headline (already localized). */
    title: string
    /** Supporting line explaining the consequence (already localized). */
    description?: string
    /** Label of the destructive button (defaults to the shared "Xoá"). */
    confirmLabel?: string
    /** Pending state while the destructive write is in flight. */
    isPending?: boolean
}

/**
 * Tiny confirm-before-destroy dialog shared by the post ⋯ menu ("Xoá bài viết")
 * and the comment row's delete action. Kept intentionally minimal — a headline,
 * one explanatory line, and a cancel / confirm pair — so both destructive flows
 * read the same and neither hand-rolls `window.confirm`.
 *
 * @param props - {@link ConfirmDialogProps}
 */
export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel,
    isPending = false,
}: ConfirmDialogProps) => {
    const t = useTranslations("communityHub")

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
                                {title}
                            </Typography>
                        </Modal.Header>
                        {description ? (
                            <Modal.Body>
                                <Typography type="body-sm" color="muted">
                                    {description}
                                </Typography>
                            </Modal.Body>
                        ) : null}
                        <Modal.Footer className="justify-end gap-2">
                            <Button size="sm" variant="ghost" onPress={onClose} isDisabled={isPending}>
                                {t("engagement.cancel")}
                            </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                onPress={onConfirm}
                                isPending={isPending}
                                isDisabled={isPending}
                            >
                                {confirmLabel ?? t("engagement.delete")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
