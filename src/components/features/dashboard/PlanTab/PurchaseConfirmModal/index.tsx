"use client"

import React, { useEffect, useState } from "react"
import { Button, Modal, Typography, cn } from "@heroui/react"
import { useTranslations } from "next-intl"
import { PaymentType } from "@/modules/types/enums/payment-type"
import { handleRadioGroupKeyDown } from "@/components/features/profile/Settings/radio-group"

/** Props for {@link PurchaseConfirmModal}. */
export interface PurchaseConfirmModalProps {
    /** Whether the dialog is open. */
    isOpen: boolean
    /** Close without buying (backdrop, Esc, cancel). Ignored while pending. */
    onClose: () => void
    /** What is being bought, already localized (plan / membership name). */
    planLabel: string
    /** The amount the gateway will charge, already formatted (e.g. `199.000₫`). */
    amountLabel: string
    /** Optional extra line under the amount (e.g. the USD equivalent). */
    amountHint?: string | null
    /** Gateways this product accepts, in render order. The first one is preselected. */
    methods: Array<PaymentType>
    /** True while the checkout mutation is in flight. */
    isPending: boolean
    /** Localized failure line shown inside the dialog; `null` clears it. */
    errorMessage?: string | null
    /** Start the checkout with the gateway the user picked. */
    onConfirm: (method: PaymentType) => void
}

/**
 * The confirm-before-you-pay step shared by both purchase screens of the
 * dashboard "My Plan" tab (FrosTES plan, community membership).
 *
 * Nothing charges from this dialog: it states WHAT is bought and HOW MUCH, lets
 * the user pick a gateway, and only then runs the caller's mutation — which
 * answers with a checkout URL the user still has to complete on the gateway.
 * Failures stay INSIDE the dialog ({@link PurchaseConfirmModalProps.errorMessage})
 * so a payment that never started is never mistaken for one that did.
 *
 * The method picker is the same hand-rolled roving-focus radiogroup the rest of
 * settings uses ({@link handleRadioGroupKeyDown}), so keyboard behaviour matches
 * the appearance / privacy pickers.
 *
 * @param props - {@link PurchaseConfirmModalProps}
 */
export const PurchaseConfirmModal = ({
    isOpen,
    onClose,
    planLabel,
    amountLabel,
    amountHint = null,
    methods,
    isPending,
    errorMessage = null,
    onConfirm,
}: PurchaseConfirmModalProps) => {
    const t = useTranslations()
    const [method, setMethod] = useState<PaymentType>(methods[0])

    // every re-open starts from the product's default gateway — a method picked in
    // a previous (possibly failed) attempt must not silently carry over
    useEffect(() => {
        if (isOpen) {
            setMethod(methods[0])
        }
    }, [isOpen, methods])

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => {
                if (!open && !isPending) {
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
                                            {amountLabel}
                                        </Typography>
                                    </div>
                                    {amountHint ? (
                                        <Typography type="body-xs" color="muted" className="text-right">
                                            {amountHint}
                                        </Typography>
                                    ) : null}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Typography type="body-xs" color="muted">
                                        {t("profileSettings.purchase.methodLabel")}
                                    </Typography>
                                    <div
                                        role="radiogroup"
                                        aria-label={t("profileSettings.purchase.methodLabel")}
                                        className="flex flex-col gap-2"
                                        onKeyDown={handleRadioGroupKeyDown}
                                    >
                                        {methods.map((option) => {
                                            const isSelected = option === method
                                            return (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={isSelected}
                                                    aria-disabled={isPending}
                                                    disabled={isPending}
                                                    tabIndex={isSelected ? 0 : -1}
                                                    onClick={() => setMethod(option)}
                                                    className={cn(
                                                        "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left text-sm outline-none transition-colors",
                                                        "focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-overlay",
                                                        isSelected
                                                            ? "border-accent bg-accent/10 text-accent"
                                                            : "border-default text-foreground hover:bg-default",
                                                    )}
                                                >
                                                    <span className="font-semibold">
                                                        {t(`profileSettings.purchase.methods.${option}`)}
                                                    </span>
                                                    <span className="text-xs text-muted">
                                                        {t(`payment.${option}.desc`)}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <Typography type="body-xs" color="muted">
                                    {t("profileSettings.purchase.notice")}
                                </Typography>

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
                                isDisabled={isPending}
                            >
                                {t("common.cancel")}
                            </Button>
                            <Button
                                size="sm"
                                variant="primary"
                                onPress={() => onConfirm(method)}
                                isPending={isPending}
                                isDisabled={isPending}
                            >
                                {t("profileSettings.purchase.confirm")}
                            </Button>
                        </Modal.Footer>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}
