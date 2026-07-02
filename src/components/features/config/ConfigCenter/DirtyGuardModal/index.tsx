"use client"

import React from "react"
import { Button, Modal, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"

/** Props for {@link DirtyGuardModal}. */
export interface DirtyGuardModalProps {
    /** Whether the guard dialog is open. */
    isOpen: boolean
    /** Fired when the operator stays — the pending navigation is dropped. */
    onStay: () => void
    /** Fired when the operator leaves — the draft is discarded and navigation proceeds. */
    onLeave: () => void
}

/**
 * DirtyGuardModal — the "unsaved changes" confirmation shown when a category
 * navigation is attempted while a setting form is dirty. Stay keeps the draft;
 * Leave discards it and continues. HeroUI Modal provides focus-trap + Esc
 * (Esc = stay).
 */
export const DirtyGuardModal = ({ isOpen, onStay, onLeave }: DirtyGuardModalProps) => {
    const t = useTranslations()

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => !open && onStay()}>
            <Modal.Backdrop>
                <Modal.Container size="sm">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Typography type="body" weight="semibold">
                                {t("admin.config.settings.dirtyTitle")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body className="gap-6">
                            <Typography type="body-sm" color="muted">
                                {t("admin.config.settings.dirtyBody")}
                            </Typography>
                            <div className="flex justify-end gap-2">
                                <Button variant="secondary" onPress={onStay}>
                                    {t("admin.config.settings.dirtyStay")}
                                </Button>
                                <Button variant="danger" onPress={onLeave}>
                                    {t("admin.config.settings.dirtyLeave")}
                                </Button>
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
