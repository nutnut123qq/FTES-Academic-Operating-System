"use client"

import React from "react"
import { Button, Modal, Typography } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link ConfirmDialog}. */
export interface ConfirmDialogProps extends WithClassNames<undefined> {
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
    /** Label of the destructive button (already localized). */
    confirmLabel: string
    /** Label of the dismiss button (already localized). */
    cancelLabel: string
    /** Pending state while the destructive write is in flight. */
    isPending?: boolean
}

/**
 * The house confirm-before-destroy dialog: a headline, one explanatory line, and a
 * cancel / confirm pair, so no destructive flow hand-rolls `window.confirm`.
 *
 * Props-only by design — EVERY label arrives already localized. The previous version
 * of this dialog resolved its cancel/confirm labels from the `communityHub` i18n
 * namespace, which quietly made it community-only: any other area reusing it dragged
 * that namespace along. Callers now pass their own copy, so settings, groups and the
 * feed can share one dialog without sharing one namespace.
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
    cancelLabel,
    isPending = false,
    className,
}: ConfirmDialogProps) => {
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
                    <Modal.Dialog className={className ?? "w-full max-w-md"}>
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
                            <Button
                                size="sm"
                                variant="ghost"
                                onPress={onClose}
                                isDisabled={isPending}
                            >
                                {cancelLabel}
                            </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                onPress={onConfirm}
                                isPending={isPending}
                                isDisabled={isPending}
                            >
                                {confirmLabel}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
