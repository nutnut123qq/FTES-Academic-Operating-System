"use client"

import React, { useEffect, useState } from "react"
import { Button, Chip, Modal, Typography, cn } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import {
    BankIcon,
    CheckCircleIcon,
    CircleNotchIcon,
    CoinsIcon,
    XCircleIcon,
} from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { isPaidOrderStatus } from "@/modules/api/rest/commerce"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { usePostCheckoutSwr } from "@/hooks/swr/api/rest/mutations/usePostCheckoutSwr"
import { usePostValidateCouponSwr } from "@/hooks/swr/api/rest/mutations/usePostValidateCouponSwr"
import { useGetMyWalletSwr } from "@/hooks/swr/api/rest/queries/useGetMyWalletSwr"
import { useGetOrderSwr } from "@/hooks/swr/api/rest/queries/useGetOrderSwr"
import { QRCode } from "@/components/reuseable/QRCode"

type PayMethod = "VIETQR" | "COIN"
type Phase = "choose" | "awaiting" | "success" | "failed"

/**
 * PaymentModal (§13) — the single global checkout modal, opened by every purchase
 * entry point via `usePaymentOverlayState().open(context)`. Two settlement paths:
 *
 * - **VietQR**: optional coupon → `checkout` → render the returned QR + poll the
 *   order until the webhook flips it to `PAID` (or it expires/fails).
 * - **Xu (COIN)**: pay from the wallet balance; the backend charges synchronously
 *   so the checkout response is final (no polling).
 *
 * ponytail: one file, one small state machine (choose → awaiting → success/failed);
 * the QR is a demo until the backend returns a real gateway payload.
 */
export const PaymentModal = ({ className }: WithClassNames<undefined>) => {
    const { isOpen, setOpen, context } = usePaymentOverlayState()
    const t = useTranslations("payment")
    const format = useFormatter()
    const { mutate } = useSWRConfig()

    const checkoutSwr = usePostCheckoutSwr()
    const couponSwr = usePostValidateCouponSwr()
    const walletSwr = useGetMyWalletSwr()

    const [method, setMethod] = useState<PayMethod>("VIETQR")
    const [phase, setPhase] = useState<Phase>("choose")
    const [coupon, setCoupon] = useState("")
    const [discount, setDiscount] = useState(0)
    const [couponError, setCouponError] = useState(false)
    const [payError, setPayError] = useState<string | null>(null)
    const [orderId, setOrderId] = useState("")
    const [qrCode, setQrCode] = useState("")

    const amountVnd = context?.amountVnd ?? 0
    const amountCoin = context?.amountCoin
    const showVietqr = amountVnd > 0
    const showCoin = amountCoin != null && amountCoin > 0
    const balance = walletSwr.data?.balance ?? 0
    const netVnd = Math.max(amountVnd - discount, 0)

    // Reset the machine each time the modal opens; default to whichever method the
    // item supports (coin-only items open straight on the Xu tab).
    useEffect(() => {
        if (!isOpen) return
        setMethod(amountVnd > 0 ? "VIETQR" : "COIN")
        setPhase("choose")
        setCoupon("")
        setDiscount(0)
        setCouponError(false)
        setPayError(null)
        setOrderId("")
        setQrCode("")
    }, [isOpen, amountVnd])

    // VietQR: poll the created order until the webhook settles it.
    const orderPoll = useGetOrderSwr(orderId, { poll: phase === "awaiting" })
    const polledStatus = orderPoll.data?.status
    useEffect(() => {
        if (phase !== "awaiting" || !polledStatus) return
        if (isPaidOrderStatus(polledStatus)) {
            setPhase("success")
            void mutate("GET_CART_SWR")
            void mutate(["GET_MY_WALLET_SWR"])
        } else if (
            polledStatus === "FAILED" ||
            polledStatus === "CANCELLED" ||
            polledStatus === "EXPIRED"
        ) {
            setPhase("failed")
        }
    }, [phase, polledStatus, mutate])

    if (!context) return null

    const applyCoupon = async () => {
        const code = coupon.trim()
        if (!code) return
        setCouponError(false)
        try {
            const preview = await couponSwr.trigger({
                couponName: code,
                orderAmount: amountVnd,
            })
            setDiscount(preview.discount)
        } catch {
            setDiscount(0)
            setCouponError(true)
        }
    }

    const clearCoupon = () => {
        setCoupon("")
        setDiscount(0)
        setCouponError(false)
    }

    const pay = async () => {
        setPayError(null)
        try {
            const result = await checkoutSwr.trigger({
                itemIds: context.itemIds,
                couponName: method === "VIETQR" && discount > 0 ? coupon.trim() : undefined,
                payMethod: method,
                idempotencyKey: crypto.randomUUID(),
            })
            if (method === "COIN") {
                if (isPaidOrderStatus(result.status)) {
                    setPhase("success")
                    void mutate(["GET_MY_WALLET_SWR"])
                    void mutate("GET_CART_SWR")
                } else {
                    setPayError(t("checkout.failedHint"))
                }
                return
            }
            // VietQR → show the QR and start polling
            setOrderId(result.orderId)
            setQrCode(result.qrCode ?? "")
            setPhase("awaiting")
        } catch {
            setPayError(method === "COIN" ? t("checkout.insufficient") : t("checkout.failedHint"))
        }
    }

    const close = () => setOpen(false)

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className={cn("w-full max-w-md", className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header>
                            <div className="text-2xl font-bold">{t("checkout.title")}</div>
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-5">
                            {/* summary — always visible */}
                            <div className="flex items-start justify-between gap-3 rounded-2xl border border-separator p-4">
                                <Typography type="body-sm" weight="medium" className="min-w-0">
                                    {context.title}
                                </Typography>
                                <Typography type="body-sm" weight="bold" className="shrink-0 text-accent">
                                    {showVietqr
                                        ? t("checkout.amountVnd", { amount: format.number(amountVnd) })
                                        : t("checkout.amountCoin", { amount: format.number(amountCoin ?? 0) })}
                                </Typography>
                            </div>

                            {phase === "choose" ? (
                                <ChooseView
                                    t={t}
                                    format={format}
                                    method={method}
                                    setMethod={setMethod}
                                    showVietqr={showVietqr}
                                    showCoin={showCoin}
                                    coupon={coupon}
                                    setCoupon={setCoupon}
                                    discount={discount}
                                    couponError={couponError}
                                    couponPending={couponSwr.isMutating}
                                    applyCoupon={applyCoupon}
                                    clearCoupon={clearCoupon}
                                    netVnd={netVnd}
                                    amountCoin={amountCoin ?? 0}
                                    balance={balance}
                                    payError={payError}
                                    payPending={checkoutSwr.isMutating}
                                    pay={pay}
                                />
                            ) : null}

                            {phase === "awaiting" ? (
                                <AwaitingView t={t} format={format} qrCode={qrCode} amount={netVnd} />
                            ) : null}

                            {phase === "success" ? <SuccessView t={t} onDone={close} /> : null}

                            {phase === "failed" ? (
                                <FailedView t={t} onRetry={() => setPhase("choose")} onClose={close} />
                            ) : null}
                        </Modal.Body>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}

type Tr = ReturnType<typeof useTranslations>
type Fmt = ReturnType<typeof useFormatter>

/** Method choice + coupon (VietQR) / balance (Xu) + pay button. */
const ChooseView = ({
    t,
    format,
    method,
    setMethod,
    showVietqr,
    showCoin,
    coupon,
    setCoupon,
    discount,
    couponError,
    couponPending,
    applyCoupon,
    clearCoupon,
    netVnd,
    amountCoin,
    balance,
    payError,
    payPending,
    pay,
}: {
    t: Tr
    format: Fmt
    method: PayMethod
    setMethod: (m: PayMethod) => void
    showVietqr: boolean
    showCoin: boolean
    coupon: string
    setCoupon: (v: string) => void
    discount: number
    couponError: boolean
    couponPending: boolean
    applyCoupon: () => void
    clearCoupon: () => void
    netVnd: number
    amountCoin: number
    balance: number
    payError: string | null
    payPending: boolean
    pay: () => void
}) => {
    const insufficient = method === "COIN" && balance < amountCoin
    return (
        <div className="flex flex-col gap-4">
            {/* method toggle — only when both paths are available */}
            {showVietqr && showCoin ? (
                <div className="flex gap-2">
                    <Button
                        variant={method === "VIETQR" ? "secondary" : "ghost"}
                        onPress={() => setMethod("VIETQR")}
                        fullWidth
                    >
                        <BankIcon className="size-4" aria-hidden />
                        {t("checkout.method.vietqr")}
                    </Button>
                    <Button
                        variant={method === "COIN" ? "secondary" : "ghost"}
                        onPress={() => setMethod("COIN")}
                        fullWidth
                    >
                        <CoinsIcon className="size-4" aria-hidden />
                        {t("checkout.method.coin")}
                    </Button>
                </div>
            ) : null}

            {/* VietQR: coupon input + discount summary */}
            {method === "VIETQR" ? (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <input
                            value={coupon}
                            onChange={(event) => setCoupon(event.target.value)}
                            placeholder={t("checkout.coupon.placeholder")}
                            aria-label={t("checkout.coupon.label")}
                            className="w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                        />
                        {discount > 0 ? (
                            <Button variant="ghost" onPress={clearCoupon}>
                                {t("checkout.coupon.clear")}
                            </Button>
                        ) : (
                            <Button variant="secondary" onPress={applyCoupon} isDisabled={couponPending}>
                                {t("checkout.coupon.apply")}
                            </Button>
                        )}
                    </div>
                    {couponError ? (
                        <Typography type="body-xs" className="text-danger">
                            {t("checkout.coupon.invalid")}
                        </Typography>
                    ) : null}
                    {discount > 0 ? (
                        <div className="flex items-center justify-between gap-2">
                            <Chip size="sm" variant="soft" color="success">
                                {t("checkout.discount", { amount: format.number(discount) })}
                            </Chip>
                            <Typography type="body-sm" weight="bold">
                                {t("checkout.amountVnd", { amount: format.number(netVnd) })}
                            </Typography>
                        </div>
                    ) : null}
                </div>
            ) : null}

            {/* Xu: wallet balance */}
            {method === "COIN" ? (
                <div className="flex items-center justify-between gap-2 rounded-2xl border border-separator p-4">
                    <Typography type="body-sm" color="muted">
                        {t("checkout.coinBalance")}
                    </Typography>
                    <Typography
                        type="body-sm"
                        weight="bold"
                        className={cn(insufficient ? "text-danger" : "text-accent")}
                    >
                        {format.number(balance)}
                    </Typography>
                </div>
            ) : null}

            {insufficient ? (
                <Typography type="body-xs" className="text-danger">
                    {t("checkout.insufficient")}
                </Typography>
            ) : null}
            {payError ? (
                <Typography type="body-xs" className="text-danger">
                    {payError}
                </Typography>
            ) : null}

            <Button
                variant="primary"
                onPress={pay}
                isDisabled={payPending || insufficient}
                fullWidth
            >
                {t("checkout.pay")}
            </Button>
        </div>
    )
}

/** VietQR: the QR to scan + a "waiting for payment" indicator. */
const AwaitingView = ({
    t,
    format,
    qrCode,
    amount,
}: {
    t: Tr
    format: Fmt
    qrCode: string
    amount: number
}) => (
    <div className="flex flex-col items-center gap-4 py-2">
        <QRCode size={220} data={qrCode || "FTES"} />
        <Typography type="body-sm" color="muted" className="text-center">
            {t("checkout.scanHint")}
        </Typography>
        <Typography type="body-sm" weight="bold" className="text-accent">
            {t("checkout.amountVnd", { amount: format.number(amount) })}
        </Typography>
        <div className="flex items-center gap-2 text-muted">
            <CircleNotchIcon className="size-4 animate-spin" aria-hidden />
            <Typography type="body-sm" color="muted">
                {t("checkout.awaiting")}
            </Typography>
        </div>
    </div>
)

/** Paid: success confirmation. */
const SuccessView = ({ t, onDone }: { t: Tr; onDone: () => void }) => (
    <div className="flex flex-col items-center gap-4 py-4">
        <CheckCircleIcon weight="fill" className="size-14 text-success" aria-hidden />
        <Typography type="body" weight="bold">
            {t("checkout.success")}
        </Typography>
        <Button variant="primary" onPress={onDone} fullWidth>
            {t("checkout.done")}
        </Button>
    </div>
)

/** Failed/expired/cancelled: retry or close. */
const FailedView = ({
    t,
    onRetry,
    onClose,
}: {
    t: Tr
    onRetry: () => void
    onClose: () => void
}) => (
    <div className="flex flex-col items-center gap-4 py-4">
        <XCircleIcon weight="fill" className="size-14 text-danger" aria-hidden />
        <Typography type="body" weight="bold">
            {t("checkout.failed")}
        </Typography>
        <div className="flex w-full gap-2">
            <Button variant="ghost" onPress={onClose} fullWidth>
                {t("checkout.close")}
            </Button>
            <Button variant="primary" onPress={onRetry} fullWidth>
                {t("checkout.retry")}
            </Button>
        </div>
    </div>
)
