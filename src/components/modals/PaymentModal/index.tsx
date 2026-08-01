"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { Button, Chip, Modal, Typography, cn } from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { useRouter } from "next/navigation"
import {
    ArrowRightIcon,
    BankIcon,
    ClockIcon,
    CoinsIcon,
    XCircleIcon,
} from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import { isPaidOrderStatus } from "@/modules/api/rest/commerce"
import { SegmentedControl } from "@/components/blocks/navigation/SegmentedControl"
import { CoverImage } from "@/components/blocks/media/CoverImage"
import { PriceTag } from "@/components/blocks/commerce/PriceTag"
import { MascotBubble } from "@/components/reuseable/FtesMascot"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { usePostCheckoutSwr } from "@/hooks/swr/api/rest/mutations/usePostCheckoutSwr"
import { usePostValidateCouponSwr } from "@/hooks/swr/api/rest/mutations/usePostValidateCouponSwr"
import { useGetMyWalletSwr } from "@/hooks/swr/api/rest/queries/useGetMyWalletSwr"
import { useGetOrderSwr } from "@/hooks/swr/api/rest/queries/useGetOrderSwr"
import { QRCode } from "@/components/reuseable/QRCode"

type PayMethod = "VIETQR" | "COIN"
type Phase = "choose" | "awaiting" | "success" | "failed"
/** Which wizard step is shown — a "Summary → Payment" two-step over the pay machinery. */
type Step = "summary" | "payment"

/**
 * Whether the "Summary" step is locked (unreachable). True once a payment is in flight
 * or settled (`phase !== "choose"`): after a QR is shown / coins are charged the buyer
 * must not rewind to re-edit the order, so the Summary segment is disabled and the modal
 * is pinned to the Payment step. Exported for the step-gating test.
 */
export const isSummaryLocked = (phase: Phase): boolean => phase !== "choose"

/**
 * Số tiền hiển thị ở dòng tóm tắt phải là số SẼ BỊ TRỪ theo phương thức ĐANG CHỌN, không phải
 * theo phương thức khả dụng: sản phẩm có cả giá VND lẫn giá Xu, chọn Xu mà vẫn in "299.000₫"
 * trong khi ví bị trừ 2.990 Xu là sai lệch trên đường tiền.
 */
export const summaryAmount = (
    method: PayMethod,
    amountVnd: number,
    amountCoin?: number,
): { unit: "vnd" | "coin"; value: number } =>
    method === "COIN" ? { unit: "coin", value: amountCoin ?? 0 } : { unit: "vnd", value: amountVnd }

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
    const router = useRouter()

    const checkoutSwr = usePostCheckoutSwr()
    const couponSwr = usePostValidateCouponSwr()
    const walletSwr = useGetMyWalletSwr()

    const [step, setStep] = useState<Step>("summary")
    const [method, setMethod] = useState<PayMethod>("VIETQR")
    const [phase, setPhase] = useState<Phase>("choose")
    const [coupon, setCoupon] = useState("")
    const [discount, setDiscount] = useState(0)
    const [couponError, setCouponError] = useState(false)
    const [payError, setPayError] = useState<string | null>(null)
    // Hết giờ đếm ngược → vẫn dùng nhánh `failed`, cờ này chỉ đổi copy/icon sang "hết hạn".
    const [expired, setExpired] = useState(false)
    const [orderId, setOrderId] = useState("")
    const [qrCode, setQrCode] = useState("")

    const amountVnd = context?.amountVnd ?? 0
    const amountCoin = context?.amountCoin
    const showVietqr = amountVnd > 0
    const showCoin = amountCoin != null && amountCoin > 0
    const balance = walletSwr.data?.balance ?? 0
    const netVnd = Math.max(amountVnd - discount, 0)

    // List → sale saving for the summary box: only on the VND path, and only when the
    // caller passed a real pre-discount list total above the payable amount. The COIN
    // path has no list price, so it never shows savings. This is the product's
    // list→sale gap; any coupon is a SEPARATE discount shown inside ChooseView.
    const originalAmountVnd = context?.originalAmountVnd ?? 0
    const showSavings = method === "VIETQR" && originalAmountVnd > amountVnd
    const savedVnd = showSavings ? originalAmountVnd - amountVnd : 0
    const savedPercent = showSavings ? Math.round((savedVnd / originalAmountVnd) * 100) : 0

    // Reset the machine each time the modal opens; default to whichever method the
    // item supports (coin-only items open straight on the Xu tab).
    useEffect(() => {
        if (!isOpen) return
        setStep("summary")
        setMethod(amountVnd > 0 ? "VIETQR" : "COIN")
        setPhase("choose")
        setCoupon("")
        setDiscount(0)
        setCouponError(false)
        setPayError(null)
        setExpired(false)
        setOrderId("")
        setQrCode("")
    }, [isOpen, amountVnd])

    // Guard: once a QR/pay is in flight or settled, pin the modal to the Payment step so
    // the buyer can't rewind to the Summary mid-payment (the Summary segment is disabled
    // in the same phases). Never runs while still on `choose`, so it can't fight a manual
    // "back to Summary" tap the user makes before paying.
    useEffect(() => {
        if (isSummaryLocked(phase)) setStep("payment")
    }, [phase])

    // VietQR: poll the created order until the webhook settles it. Đồng hồ 5 phút là con số
    // của FE (BE chưa trả expiresAt), KHÔNG phải hạn thật của đơn — nên hết giờ vẫn PHẢI poll
    // tiếp: app ngân hàng chậm/OTP lâu, tiền vào ở phút thứ 6 mà UI đã bỏ theo dõi thì người
    // học thấy "hết hạn" rồi trả lần hai.
    const orderPoll = useGetOrderSwr(orderId, { poll: phase === "awaiting" || expired })
    const polledStatus = orderPoll.data?.status
    useEffect(() => {
        if (!polledStatus) return
        if (phase !== "awaiting" && !(expired && phase === "failed")) return
        if (isPaidOrderStatus(polledStatus)) {
            setPhase("success")
            void mutate("GET_CART_SWR")
            void mutate(["GET_MY_WALLET_SWR"])
            context?.onSuccess?.()
        } else if (
            polledStatus === "FAILED" ||
            polledStatus === "CANCELLED" ||
            polledStatus === "EXPIRED"
        ) {
            setPhase("failed")
        }
    }, [phase, expired, polledStatus, mutate, context])

    // Hết đồng hồ: rời pha awaiting nhưng KHÔNG ngừng theo dõi đơn (poll bám thêm cờ expired),
    // để tiền vào muộn vẫn lật sang success. Giữ identity ổn định để đồng hồ trong AwaitingView
    // không bị khởi động lại mỗi lần poll re-render.
    const handleExpire = useCallback(() => {
        setExpired(true)
        setPhase("failed")
    }, [])

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
                    context?.onSuccess?.()
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

    // The payable amount shown per the ACTIVE method (VND or Xu) — reused by the Summary
    // step's plain-amount line and the Payment step's slim recap.
    const shown = summaryAmount(method, amountVnd, amountCoin)
    const shownAmountLabel =
        shown.unit === "vnd"
            ? t("checkout.amountVnd", { amount: format.number(shown.value) })
            : t("checkout.amountCoin", { amount: format.number(shown.value) })

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container>
                    <Modal.Dialog className={cn("w-full max-w-md", className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex flex-col gap-3">
                            <div className="text-2xl font-bold">{t("checkout.title")}</div>
                            <SegmentedControl<Step>
                                ariaLabel={t("checkout.title")}
                                items={[
                                    {
                                        value: "summary",
                                        label: t("checkout.summaryTab"),
                                        isDisabled: isSummaryLocked(phase),
                                    },
                                    { value: "payment", label: t("checkout.paymentTab") },
                                ]}
                                value={step}
                                onChange={setStep}
                            />
                        </Modal.Header>
                        <Modal.Body className="flex flex-col gap-5">
                            {step === "summary" ? (
                                <div className="flex flex-col gap-5">
                                    {/* course thumbnail + title */}
                                    <div className="flex items-start gap-3">
                                        {context.imageUrl ? (
                                            <CoverImage
                                                src={context.imageUrl}
                                                alt={context.title}
                                                className="size-14 shrink-0"
                                            />
                                        ) : null}
                                        <Typography
                                            type="body"
                                            weight="semibold"
                                            className="min-w-0 flex-1 line-clamp-2"
                                        >
                                            {context.title}
                                        </Typography>
                                    </div>

                                    {/* payable amount — large/bold; discounted VND buys strike the
                                        original + show the −X% chip (PriceTag) and the savings line. */}
                                    <div className="flex flex-col gap-1">
                                        {showSavings ? (
                                            <PriceTag
                                                discounted={amountVnd}
                                                original={originalAmountVnd}
                                                size="lg"
                                            />
                                        ) : (
                                            <Typography type="h3" weight="bold" className="text-accent">
                                                {shownAmountLabel}
                                            </Typography>
                                        )}
                                        {showSavings ? (
                                            <Typography type="body-sm" className="text-success">
                                                {t("checkout.savings", {
                                                    amount: format.number(savedVnd),
                                                    percent: savedPercent,
                                                })}
                                            </Typography>
                                        ) : null}
                                    </div>

                                    <Button
                                        variant="primary"
                                        fullWidth
                                        className="rounded-full"
                                        onPress={() => setStep("payment")}
                                    >
                                        {t("checkout.continueToPayment")}
                                        <ArrowRightIcon aria-hidden focusable="false" className="size-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-5">
                                    {/* slim recap — small thumbnail + title + payable amount */}
                                    <div className="flex items-center gap-3 rounded-2xl border border-separator p-3">
                                        {context.imageUrl ? (
                                            <CoverImage
                                                src={context.imageUrl}
                                                alt={context.title}
                                                className="size-10 shrink-0"
                                            />
                                        ) : null}
                                        <Typography
                                            type="body-sm"
                                            weight="medium"
                                            className="min-w-0 flex-1 line-clamp-1"
                                        >
                                            {context.title}
                                        </Typography>
                                        <Typography
                                            type="body-sm"
                                            weight="bold"
                                            className="shrink-0 text-accent"
                                        >
                                            {shownAmountLabel}
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
                                        <AwaitingView
                                            t={t}
                                            format={format}
                                            qrCode={qrCode}
                                            amount={netVnd}
                                            expiresAt={orderPoll.data?.expiresAt}
                                            onExpire={handleExpire}
                                        />
                                    ) : null}

                                    {phase === "success" ? (
                                        <SuccessView
                                            t={t}
                                            onDone={close}
                                            onLearn={
                                                context.learnHref
                                                    ? () => {
                                                        close()
                                                        router.push(context.learnHref as string)
                                                    }
                                                    : undefined
                                            }
                                        />
                                    ) : null}

                                    {phase === "failed" ? (
                                        <FailedView
                                            t={t}
                                            expired={expired}
                                            onRetry={() => {
                                                setExpired(false)
                                                setPhase("choose")
                                            }}
                                            onClose={close}
                                        />
                                    ) : null}
                                </div>
                            )}
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

/**
 * Cửa sổ đỡ tạm khi đơn KHÔNG mang `expiresAt` (đơn tạo trước change `commerce-order-expires-at`,
 * hoặc BE chưa deploy). Suy từ `CommerceProperties.paymentExpiryMinutes` mặc định 30 mà
 * `OrderExpireJob` quét theo. Chỉ là giả định của FE — có `expiresAt` thì luôn ưu tiên nó.
 */
const AWAITING_FALLBACK_SECONDS = 30 * 60

/**
 * Mốc hết hạn TUYỆT ĐỐI của đồng hồ đếm ngược: hạn thật của BE nếu parse được, không thì neo
 * dự phòng. Tách riêng để test được — đây là chỗ dễ sai nhất của cả modal: đoán NGẮN hơn hạn
 * thật thì báo "hết hạn" trong khi đơn còn sống (người ta tạo đơn mới rồi trả hai lần), đoán
 * DÀI hơn thì để người ta ngồi quét một mã đã chết.
 *
 * @param expiresAt - `OrderView.expiresAt` (ISO) — có thể thiếu ở đơn cũ / BE chưa deploy.
 * @param fallbackDeadline - mốc dự phòng đã tính sẵn (epoch ms).
 */
export const resolveAwaitingDeadline = (
    expiresAt: string | undefined,
    fallbackDeadline: number,
): number => {
    const parsed = expiresAt ? Date.parse(expiresAt) : Number.NaN
    return Number.isFinite(parsed) ? parsed : fallbackDeadline
}

/** Số giây còn lại → "mm:ss". */
const formatCountdown = (seconds: number) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`

/** VietQR: mã QR + đồng hồ đếm ngược tới HẠN THẬT của đơn (`expiresAt`). */
const AwaitingView = ({
    t,
    format,
    qrCode,
    amount,
    expiresAt,
    onExpire,
}: {
    t: Tr
    format: Fmt
    qrCode: string
    amount: number
    /** Hạn thật của đơn (ISO) từ BE; thiếu → rơi về `AWAITING_FALLBACK_SECONDS`. */
    expiresAt?: string
    onExpire: () => void
}) => {
    /**
     * Mốc hết hạn TUYỆT ĐỐI. Ưu tiên `expiresAt` của BE — đó mới là mốc `OrderExpireJob` thật sự
     * huỷ đơn. Hằng số FE chỉ để đỡ khi thiếu; đoán ngắn hơn hạn thật là báo "hết hạn" trong khi
     * đơn còn sống, đoán dài hơn là để người ta quét một mã đã chết.
     *
     * View mount NGAY khi vào pha awaiting, còn `expiresAt` phải đợi vòng poll đầu → không được
     * chốt cứng lúc mount, làm vậy là khoá luôn số đoán dù hạn thật về ngay sau đó. Neo dự phòng
     * giữ trong ref (ổn định qua mọi lần render), hạn thật về thì thay — đổi đúng MỘT lần rồi
     * giá trị không đổi nữa nên đồng hồ không giật theo mỗi vòng poll.
     */
    const fallbackDeadlineRef = useRef(Date.now() + AWAITING_FALLBACK_SECONDS * 1000)
    const deadline = resolveAwaitingDeadline(expiresAt, fallbackDeadlineRef.current)
    const [remaining, setRemaining] = useState(() =>
        Math.max(Math.ceil((deadline - Date.now()) / 1000), 0))

    // Đếm theo mốc thời gian tuyệt đối (tab bị throttle vẫn ra đúng số giây còn lại), không
    // cộng dồn tick. View chỉ tồn tại trong pha awaiting → cleanup lo cả unmount lẫn rời pha.
    useEffect(() => {
        // Cập nhật ngay khi mốc đổi (hạn thật vừa về), khỏi đợi tick kế.
        setRemaining(Math.max(Math.ceil((deadline - Date.now()) / 1000), 0))
        const timer = window.setInterval(() => {
            const left = Math.max(Math.ceil((deadline - Date.now()) / 1000), 0)
            setRemaining(left)
            if (left === 0) {
                window.clearInterval(timer)
                onExpire()
            }
        }, 1000)
        return () => window.clearInterval(timer)
    }, [deadline, onExpire])

    return (
        <div className="flex flex-col items-center gap-4 py-2">
            <QRCode size={220} data={qrCode || "FTES"} />
            <Typography type="body-sm" color="muted" className="text-center">
                {t("checkout.scanHint")}
            </Typography>
            <Typography type="body-sm" weight="bold" className="text-accent">
                {t("checkout.amountVnd", { amount: format.number(amount) })}
            </Typography>
            <div className="flex items-center gap-2">
                <ClockIcon aria-hidden focusable="false" className="size-4 text-muted" />
                <Typography type="body-sm" color="muted">
                    {t("checkout.countdownLabel")}
                </Typography>
                <Typography
                    type="body-sm"
                    weight="bold"
                    className="tabular-nums"
                    aria-live="polite"
                >
                    {formatCountdown(remaining)}
                </Typography>
            </div>
        </div>
    )
}

/**
 * Paid: FrosTES cheers the completed purchase (cheer pose) and — for a course
 * enrollment (`onLearn` set) — offers a CTA straight into the course content.
 * Non-course checkouts (cart / marketplace) get the same congratulations without
 * the learn CTA. The celebration is transient (it lives inside the checkout modal
 * the user dismisses), so it needs no persistence guard. Reduced motion is handled
 * inside {@link MascotBubble} / FtesMascot.
 */
const SuccessView = ({
    t,
    onDone,
    onLearn,
}: {
    t: Tr
    onDone: () => void
    onLearn?: () => void
}) => (
    <div className="flex flex-col gap-4 py-1">
        <MascotBubble
            pose="cheer"
            size="md"
            title={t("mascotSuccess.title")}
            actions={
                onLearn ? (
                    <Button variant="primary" onPress={onLearn}>
                        {t("mascotSuccess.learn")}
                    </Button>
                ) : null
            }
        >
            {t("mascotSuccess.body")}
        </MascotBubble>
        <Button variant={onLearn ? "ghost" : "primary"} onPress={onDone} fullWidth>
            {t("checkout.done")}
        </Button>
    </div>
)

/** Failed/expired/cancelled: retry or close. `expired` = hết 5 phút đếm ngược, không phải lỗi. */
const FailedView = ({
    t,
    expired,
    onRetry,
    onClose,
}: {
    t: Tr
    expired?: boolean
    onRetry: () => void
    onClose: () => void
}) => (
    <div className="flex flex-col items-center gap-4 py-4">
        {expired ? (
            <ClockIcon weight="fill" className="size-14 text-muted" aria-hidden />
        ) : (
            <XCircleIcon weight="fill" className="size-14 text-danger" aria-hidden />
        )}
        <Typography type="body" weight="bold">
            {t(expired ? "checkout.expired" : "checkout.failed")}
        </Typography>
        {expired ? (
            <Typography type="body-sm" color="muted" className="text-center">
                {t("checkout.expiredHint")}
            </Typography>
        ) : null}
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
