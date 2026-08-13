"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { ConfirmDialog as ConfirmDialogBlock } from "@/components/blocks/feedback/ConfirmDialog"

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
 * Community-flavoured confirm dialog: the props-only
 * {@link import("@/components/blocks/feedback/ConfirmDialog").ConfirmDialog} block with
 * the `communityHub` cancel/delete labels filled in, kept so the ~12 community/group
 * call sites need no change.
 *
 * NEW areas should use the block directly and pass their own labels — this wrapper
 * exists only to keep the community copy in one place, not to be the shared dialog.
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
        <ConfirmDialogBlock
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={title}
            description={description}
            confirmLabel={confirmLabel ?? t("engagement.delete")}
            cancelLabel={t("engagement.cancel")}
            isPending={isPending}
        />
    )
}
