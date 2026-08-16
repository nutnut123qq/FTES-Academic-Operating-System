"use client"

import React from "react"
import { Button, Modal, Typography } from "@heroui/react"
import { useTranslations } from "next-intl"
import { CheckCircleIcon, ClockIcon, XCircleIcon } from "@phosphor-icons/react"
import { QRCode } from "@/components/reuseable/QRCode"
import { formatVnd } from "@/components/blocks/commerce/PriceTag"
import type { PlanOrderPhase } from "../planOrderPhase"
import type { PlanPurchaseTicket } from "../usePlanPurchase"

/** Props for {@link PlanPurchaseModal}. */
export interface PlanPurchaseModalProps {
    /** Whether the dialog is open. */
    isOpen: boolean
    /** Close the dialog (backdrop, Esc, cancel). Ignored while the order is being created. */
    onClose: () => void
    /** What is being bought, already localized (plan / membership name). */
    planLabel: string
    /** The amount that will be charged, already formatted (e.g. `199.000₫`). */
    amountLabel: string
    /** Optional extra line under the amount (e.g. how long one purchase lasts). */
    amountHint?: string | null
    /** True while the create-order mutation is in flight. */
    isStarting: boolean
    /** Localized failure line for a checkout that never started; `null` clears it. */
    errorMessage?: string | null
    /** The live order, once one exists. */
    ticket: PlanPurchaseTicket | null
    /** Settled state of {@link ticket}; `null` while still on the confirm step. */
    phase: PlanOrderPhase | null
    /** Create the order (confirm step). */
    onConfirm: () => void
    /** Throw the dead order away and return to the confirm step. */
    onRetry: () => void
}

/**
 * The buy dialog shared by both plan screens of the dashboard "My Plan" tab — the same
 * two beats the course checkout uses: **confirm what you are buying, then pay a bank QR
 * while the order is polled.**
 *
 * There is no payment gateway to be sent to, so the dialog never navigates: the buyer
 * stays here from confirm → QR → settled, and every outcome is stated in place.
 *
 * - **Confirm** — plan, amount, and a notice that nothing is charged yet. This step is
 *   what makes the purchase deliberate; the order is created only by the confirm press.
 * - **Awaiting** — the VietQR payload plus the order id (which is also the transfer
 *   reference). It says the screen updates itself, because the usual reaction to silence
 *   on this screen is to transfer a second time.
 * - **Paid / expired / failed** — the settled outcome. Expired is kept separate from
 *   failed: the hold ran out, nothing broke, and a late transfer can still be reconciled.
 *
 * A checkout that fails to start keeps the dialog open with the failure and an explicit
 * "nothing was charged" line, rather than closing or routing away.
 *
 * @param props - {@link PlanPurchaseModalProps}
 */
export const PlanPurchaseModal = ({
    isOpen,
    onClose,
    planLabel,
    amountLabel,
    amountHint = null,
    isStarting,
    errorMessage = null,
    ticket,
    phase,
    onConfirm,
    onRetry,
}: PlanPurchaseModalProps) => {
    const t = useTranslations()

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open && !isStarting) {
                    onClose()
                }
            }}
        >
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-md">
                        <Modal.Header>
                            <Typography type="body" weight="bold">
                                {t("profileSettings.purchase.title")}
                            </Typography>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2 rounded-2xl border border-separator p-3">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <Typography type="body-xs" color="muted">
                                            {t("profileSettings.purchase.planLabel")}
                                        </Typography>
                                        <Typography type="body-sm" weight="semibold">
                                            {planLabel}
                                        </Typography>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <Typography type="body-xs" color="muted">
                                            {t("profileSettings.purchase.amountLabel")}
                                        </Typography>
                                        <Typography type="body" weight="bold">
                                            {ticket ? formatVnd(ticket.amount) : amountLabel}
                                        </Typography>
                                    </div>
                                    {amountHint ? (
                                        <Typography type="body-xs" color="muted" className="text-right">
                                            {amountHint}
                                        </Typography>
                                    ) : null}
                                </div>

                                {phase === null ? (
                                    <Typography type="body-xs" color="muted">
                                        {t("profileSettings.purchase.notice")}
                                    </Typography>
                                ) : null}

                                {phase === "awaiting" && ticket ? (
                                    <div className="flex flex-col items-center gap-3 py-1">
                                        <QRCode size={200} data={ticket.qrCode} />
                                        <Typography type="body-sm" color="muted" className="text-center">
                                            {t("profileSettings.purchase.scanHint")}
                                        </Typography>
                                        <div className="flex w-full items-baseline justify-between gap-3">
                                            <Typography type="body-xs" color="muted">
                                                {t("profileSettings.purchase.orderLabel")}
                                            </Typography>
                                            <Typography
                                                type="body-xs"
                                                weight="semibold"
                                                className="break-all text-right"
                                            >
                                                {ticket.orderId}
                                            </Typography>
                                        </div>
                                        <Typography
                                            type="body-sm"
                                            weight="semibold"
                                            className="text-accent"
                                            aria-live="polite"
                                        >
                                            {t("profileSettings.purchase.awaiting")}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" className="text-center">
                                            {t("profileSettings.purchase.awaitingHint")}
                                        </Typography>
                                    </div>
                                ) : null}

                                {phase === "paid" ? (
                                    <div
                                        className="flex flex-col items-center gap-2 py-2"
                                        aria-live="polite"
                                    >
                                        <CheckCircleIcon
                                            weight="fill"
                                            className="size-12 text-success"
                                            aria-hidden
                                            focusable="false"
                                        />
                                        <Typography type="body" weight="bold">
                                            {t("profileSettings.purchase.paid")}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" className="text-center">
                                            {t("profileSettings.purchase.paidHint")}
                                        </Typography>
                                    </div>
                                ) : null}

                                {phase === "expired" || phase === "failed" ? (
                                    <div
                                        className="flex flex-col items-center gap-2 py-2"
                                        aria-live="polite"
                                    >
                                        {phase === "expired" ? (
                                            <ClockIcon
                                                weight="fill"
                                                className="size-12 text-muted"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        ) : (
                                            <XCircleIcon
                                                weight="fill"
                                                className="size-12 text-danger"
                                                aria-hidden
                                                focusable="false"
                                            />
                                        )}
                                        <Typography type="body" weight="bold">
                                            {t(
                                                phase === "expired"
                                                    ? "profileSettings.purchase.expired"
                                                    : "profileSettings.purchase.orderFailed",
                                            )}
                                        </Typography>
                                        <Typography type="body-xs" color="muted" className="text-center">
                                            {t(
                                                phase === "expired"
                                                    ? "profileSettings.purchase.expiredHint"
                                                    : "profileSettings.purchase.orderFailedHint",
                                            )}
                                        </Typography>
                                    </div>
                                ) : null}

                                {errorMessage ? (
                                    <Typography type="body-xs" className="text-danger">
                                        {errorMessage}
                                    </Typography>
                                ) : null}
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="justify-end gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onPress={onClose}
                                isDisabled={isStarting}
                            >
                                {t(phase === null ? "common.cancel" : "common.close")}
                            </Button>
                            {phase === null ? (
                                <Button
                                    size="sm"
                                    variant="primary"
                                    onPress={onConfirm}
                                    isPending={isStarting}
                                    isDisabled={isStarting}
                                >
                                    {t("profileSettings.purchase.confirm")}
                                </Button>
                            ) : null}
                            {phase === "expired" || phase === "failed" ? (
                                <Button size="sm" variant="primary" onPress={onRetry}>
                                    {t("profileSettings.purchase.retry")}
                                </Button>
                            ) : null}
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
