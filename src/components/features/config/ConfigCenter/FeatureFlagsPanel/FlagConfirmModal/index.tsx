"use client"

import React from "react"
import { Button, Modal, Spinner, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import type { FeatureFlag, FlagStatus } from "@/resources/constants/config"
import { FLAG_STATUS_LABEL_KEY } from "../FlagRow"

/** A requested-but-unconfirmed flag status change. */
export interface PendingFlagChange {
    /** The flag being changed. */
    flag: FeatureFlag
    /** The requested status. */
    next: FlagStatus
}

/** Props for {@link FlagConfirmModal}. */
export interface FlagConfirmModalProps {
    /** The pending change; null = closed. */
    pending: PendingFlagChange | null
    /** True while the confirmed change is being applied. */
    isApplying: boolean
    /** Fired when the operator confirms. */
    onConfirm: () => void
    /** Fired when the operator cancels/dismisses — nothing changes. */
    onCancel: () => void
}

/**
 * FlagConfirmModal — the confirmation step before a flag status change is
 * applied (flipping a platform-wide flag affects real users immediately).
 * Cancel/Esc closes without writing; HeroUI Modal provides focus-trap + Esc.
 */
export const FlagConfirmModal = ({
    pending,
    isApplying,
    onConfirm,
    onCancel,
}: FlagConfirmModalProps) => {
    const t = useTranslations()

    return (
        <Modal isOpen={pending !== null} onOpenChange={(open) => !open && onCancel()}>
            <Modal.Backdrop>
                <Modal.Container size="sm">
                    <Modal.Dialog>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <Typography type="body" weight="semibold">
                                {t("admin.config.flags.confirmTitle")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body className="gap-6">
                            {pending ? (
                                <Typography type="body-sm" color="muted">
                                    {t("admin.config.flags.confirmBody", {
                                        key: pending.flag.key,
                                        from: t(FLAG_STATUS_LABEL_KEY[pending.flag.status]),
                                        to: t(FLAG_STATUS_LABEL_KEY[pending.next]),
                                    })}
                                </Typography>
                            ) : null}
                            <div className="flex justify-end gap-2">
                                <Button variant="secondary" onPress={onCancel} isDisabled={isApplying}>
                                    {t("common.cancel")}
                                </Button>
                                <Button
                                    variant="primary"
                                    onPress={onConfirm}
                                    isPending={isApplying}
                                    isDisabled={isApplying}
                                >
                                    {({ isPending }) => (
                                        <>
                                            {isPending ? <Spinner size="sm" color="current" /> : null}
                                            {t("admin.config.flags.confirmAction")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
