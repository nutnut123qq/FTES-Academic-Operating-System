"use client"

import React from "react"
import type { ReactNode } from "react"
import { Button, Modal, Typography, cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link ConfirmDialog} block. */
export interface ConfirmDialogProps extends WithClassNames<undefined> {
    /** Whether the dialog is open (controlled by the caller). */
    isOpen: boolean
    /** Open-state setter (`false` on dismiss/cancel). */
    onOpenChange: (isOpen: boolean) => void
    /** Question stating what is about to happen. */
    title: ReactNode
    /** Consequence description shown under the title. */
    description?: ReactNode
    /** Translated confirm-button label. */
    confirmLabel: string
    /** Translated cancel-button label. */
    cancelLabel: string
    /** Renders the confirm button in the danger tone (destructive actions). */
    isDestructive?: boolean
    /** Pending state of the confirm button while the action runs. */
    isPending?: boolean
    /** Fired when the operator confirms. The caller closes the dialog when done. */
    onConfirm: () => void
}

/**
 * Confirm-before-consequence dialog: a small modal describing the consequence
 * with an explicit Cancel / Confirm pair. Canceling (button, backdrop, or Esc)
 * only closes — the caller's state stays unchanged; nothing runs until Confirm.
 *
 * Controlled by props rather than the global overlay store: each caller opens it
 * with a per-row payload (which user/report/item), so the open state + payload
 * live together in the calling feature — the overlay-store pattern is for
 * app-global singleton overlays.
 */
export const ConfirmDialog = ({
    isOpen,
    onOpenChange,
    title,
    description,
    confirmLabel,
    cancelLabel,
    isDestructive = false,
    isPending = false,
    onConfirm,
    className,
}: ConfirmDialogProps) => {
    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className={cn("max-w-md", className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Typography type="h4" weight="semibold">{title}</Typography>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-6">
                            {description ? (
                                <Typography type="body-sm" color="muted">{description}</Typography>
                            ) : null}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="tertiary"
                                    onPress={() => onOpenChange(false)}
                                    isDisabled={isPending}
                                >
                                    {cancelLabel}
                                </Button>
                                <Button
                                    variant={isDestructive ? "danger" : "primary"}
                                    onPress={onConfirm}
                                    isPending={isPending}
                                    isDisabled={isPending}
                                >
                                    {confirmLabel}
                                </Button>
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
