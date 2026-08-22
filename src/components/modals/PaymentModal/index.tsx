"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    Button,
    Chip,
    Input,
    Label,
    Modal,
    ScrollShadow,
    TextField,
    Typography,
    cn,
} from "@heroui/react"
import { useFormatter, useTranslations } from "next-intl"
import { useSWRConfig } from "swr"
import { useRouter } from "next/navigation"
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BankIcon,
    ClockIcon,
    CoinsIcon,
    WalletIcon,
    XCircleIcon,
} from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"
import type { PaymentLine } from "@/modules/types/payment"
import { isPaidOrderStatus } from "@/modules/api/rest/commerce"
import { RestError } from "@/modules/api/rest/client"
import { CoverImage } from "@/components/blocks/media/CoverImage"
import { PriceTag } from "@/components/blocks/commerce/PriceTag"
import { MascotBubble } from "@/components/reuseable/FtesMascot"
import { usePaymentOverlayState } from "@/hooks/zustand/overlay/hooks"
import { usePostCheckoutSwr } from "@/hooks/swr/api/rest/mutations/usePostCheckoutSwr"
import { usePostValidateCouponSwr } from "@/hooks/swr/api/rest/mutations/usePostValidateCouponSwr"
import { useGetMyWalletSwr } from "@/hooks/swr/api/rest/queries/useGetMyWalletSwr"
import { useGetCoinQuoteSwr } from "@/hooks/swr/api/rest/queries/useGetCoinQuoteSwr"
import { useGetOrderSwr } from "@/hooks/swr/api/rest/queries/useGetOrderSwr"
import { QRCode } from "@/components/reuseable/QRCode"
import { clampCoinToApply, coinBreakdown, walletCoversAll } from "./coinDiscount"

/**
 * Cách người mua trả tiền, theo cách NGƯỜI MUA hiểu — không phải `payMethod` của backend:
 * - `VIETQR`  → chuyển khoản QR (có thể kèm một phần Xu để giảm tiền),
 * - `WALLET`  → trả TRỌN bằng Xu trong ví (vẫn đi rail `VIETQR` + `coinToApply` tối đa,
 *               backend thấy số tiền còn lại bằng 0 nên chốt `PAID` ngay, không sinh QR),
 * - `COIN`    → giá Xu RIÊNG của sản phẩm (rail `COIN` của backend), khác hẳn `WALLET`.
 */
type PayMethod = "VIETQR" | "WALLET" | "COIN"
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
 * `payMethod` thật sự gửi lên `POST /commerce/checkout`. `WALLET` KHÔNG phải một rail
 * riêng của backend — nó là `VIETQR` với `coinToApply` phủ trọn số tiền; áp Xu vào rail
 * `COIN` thì backend trả 400 `COMMERCE_UNSUPPORTED_PAY_METHOD`.
 */
export const backendPayMethod = (method: PayMethod): "VIETQR" | "COIN" =>
    method === "COIN" ? "COIN" : "VIETQR"

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
 * entry point via `usePaymentOverlayState().open(context)`. Settlement paths:
 *
 * - **VietQR**: mã giảm giá + (tuỳ chọn) áp Xu → `checkout` → render QR trả về + poll
 *   đơn tới khi webhook lật `PAID` (hoặc hết hạn/thất bại).
 * - **Ví (WALLET)**: áp trọn Xu nên số tiền còn lại bằng 0 → backend chốt `PAID` ngay,
 *   không có QR để quét.
 * - **Xu (COIN)**: giá Xu riêng của sản phẩm; backend trừ đồng bộ nên không cần poll.
 *
 * Đường tiền: mọi con số về Xu (trần áp được, tỉ lệ quy đổi) đều lấy từ
 * `GET /commerce/coin/quote`; FE chỉ gửi lên SỐ XU (`coinToApply`), số tiền cuối do
 * backend tính. Lỗi thì ở lại trong modal kèm câu "chưa trừ tiền", không điều hướng đi.
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
    // Refresh the balance through the hook's BOUND mutate. The wallet key now carries the
    // viewer id, and a hand-written `mutate(["GET_MY_WALLET_SWR"])` would no longer match
    // it — a SILENT no-op that leaves a stale balance on screen after a purchase. The
    // bound mutate cannot drift because it is the key.
    const mutateWallet = walletSwr.mutate

    const [step, setStep] = useState<Step>("summary")
    const [method, setMethod] = useState<PayMethod>("VIETQR")
    const [phase, setPhase] = useState<Phase>("choose")
    const [coupon, setCoupon] = useState("")
    const [discount, setDiscount] = useState(0)
    const [couponError, setCouponError] = useState(false)
    const [payError, setPayError] = useState<string | null>(null)
    /** Số Xu người mua chọn áp (chỉ có nghĩa trên rail VND; luôn kẹp theo trần của backend). */
    const [requestedCoin, setRequestedCoin] = useState(0)
    // Hết giờ đếm ngược → vẫn dùng nhánh `failed`, cờ này chỉ đổi copy/icon sang "hết hạn".
    const [expired, setExpired] = useState(false)
    const [orderId, setOrderId] = useState("")
    const [qrCode, setQrCode] = useState("")

    /**
     * Chốt chống BẤM ĐÚP (đường tiền). `checkoutSwr.isMutating` chỉ true SAU một vòng
     * render, nên hai cú bấm liên tiếp trong cùng một tick vẫn lọt cả hai — ref chặn ngay
     * trong handler, trước cả khi React kịp vẽ lại.
     */
    const payInFlightRef = useRef(false)
    /**
     * Khoá idempotency cho ĐÚNG một "ý định trả tiền" (cùng món · cùng mã giảm giá · cùng
     * số Xu · cùng phương thức). Sinh MỚI mỗi lần ý định đổi, nhưng GIỮ NGUYÊN khi bấm lại
     * cùng một ý định — nhờ vậy nếu có hai request cùng lọt tới backend thì backend gộp về
     * MỘT đơn thay vì tạo hai đơn cùng nội dung. Đây là chốt thật; ref in-flight chỉ là lớp
     * chặn sớm ở FE.
     */
    const idempotencyKeyRef = useRef("")
    const payIntentRef = useRef("")

    const amountVnd = context?.amountVnd ?? 0
    const amountCoin = context?.amountCoin
    const showVietqr = amountVnd > 0
    const showCoin = amountCoin != null && amountCoin > 0
    const balance = walletSwr.data?.balance ?? 0
    /** Số tiền sau mã giảm giá, TRƯỚC khi áp Xu. */
    const netVnd = Math.max(amountVnd - discount, 0)

    // Báo giá Xu bám ĐÚNG số tiền sau mã giảm giá: đổi mã là trần áp được đổi theo, FE
    // không tự suy. Chỉ chạy khi modal mở + còn ở bước chọn (đơn đã tạo thì Xu không áp
    // được nữa) + đang ở rail VND.
    const coinQuoteSwr = useGetCoinQuoteSwr(
        netVnd,
        isOpen && phase === "choose" && method !== "COIN",
    )
    const quote = coinQuoteSwr.data

    // Kẹp lại mỗi khi báo giá đổi (đổi mã giảm giá, số dư vừa bị trừ ở tab khác…): số Xu
    // đang chọn không được vượt trần MỚI, kẻo bấm trả là 422.
    const coinPlan = useMemo(
        () =>
            method === "WALLET"
                ? coinBreakdown(netVnd, quote?.maxApplicableCoin ?? 0, quote)
                : coinBreakdown(netVnd, requestedCoin, quote),
        [method, netVnd, requestedCoin, quote],
    )
    const coinCeiling = clampCoinToApply(Number.MAX_SAFE_INTEGER, quote)
    const canPayByWallet = walletCoversAll(quote)

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
        setRequestedCoin(0)
        setExpired(false)
        setOrderId("")
        setQrCode("")
        payInFlightRef.current = false
        idempotencyKeyRef.current = ""
        payIntentRef.current = ""
        // Resume an existing unpaid order (from the "pay invoice" popup): skip checkout, jump
        // straight to the awaiting-QR step so the buyer just re-scans and the poll settles it.
        if (context?.resumeOrderId && context?.resumeQrCode) {
            setStep("payment")
            setMethod("VIETQR")
            setOrderId(context.resumeOrderId)
            setQrCode(context.resumeQrCode)
            setPhase("awaiting")
        }
    }, [isOpen, amountVnd, context?.resumeOrderId, context?.resumeQrCode])

    // Ví hết khả năng trả trọn (đổi mã giảm giá làm số tiền vượt số dư, hoặc báo giá vừa
    // về) → rơi về chuyển khoản, không để nút "trả bằng Ví" đứng đó rồi checkout 422.
    useEffect(() => {
        if (method === "WALLET" && !canPayByWallet) setMethod("VIETQR")
    }, [method, canPayByWallet])

    // Guard: once a QR/pay is in flight or settled, pin the modal to the Payment step so
    // the buyer can't rewind to the Summary mid-payment (the Summary segment is disabled
    // in the same phases). Never runs while still on `choose`, so it can't fight a manual
    // "back to Summary" tap the user makes before paying.
    useEffect(() => {
        if (isSummaryLocked(phase)) setStep("payment")
    }, [phase])

    // VietQR: poll the created order until the webhook settles it. Đồng hồ đếm ngược là hạn
    // THẬT của đơn (`expiresAt`); thiếu thì rơi về hằng số đoán, và hết giờ vẫn PHẢI poll
    // tiếp: app ngân hàng chậm/OTP lâu, tiền vào muộn mà UI đã bỏ theo dõi thì người học
    // thấy "hết hạn" rồi trả lần hai.
    const orderPoll = useGetOrderSwr(orderId, { poll: phase === "awaiting" || expired })
    const polledStatus = orderPoll.data?.status
    useEffect(() => {
        if (!polledStatus) return
        if (phase !== "awaiting" && !(expired && phase === "failed")) return
        if (isPaidOrderStatus(polledStatus)) {
            setPhase("success")
            void mutate("GET_CART_SWR")
            void mutateWallet()
            // Đơn vừa chốt có thể đã trừ Xu (chuyển khoản + áp một phần Xu) → mọi báo giá
            // Xu trong cache đã cũ, xem `invalidateCoinQuotes`.
            void mutate(
                (key) => Array.isArray(key) && key[0] === "GET_COIN_QUOTE_SWR",
                undefined,
                { revalidate: true },
            )
            context?.onSuccess?.()
        } else if (
            polledStatus === "FAILED" ||
            polledStatus === "CANCELLED" ||
            polledStatus === "EXPIRED"
        ) {
            setPhase("failed")
        }
    }, [phase, expired, polledStatus, mutate, mutateWallet, context])

    // Hết đồng hồ: rời pha awaiting nhưng KHÔNG ngừng theo dõi đơn (poll bám thêm cờ expired),
    // để tiền vào muộn vẫn lật sang success. Giữ identity ổn định để đồng hồ trong AwaitingView
    // không bị khởi động lại mỗi lần poll re-render.
    const handleExpire = useCallback(() => {
        setExpired(true)
        setPhase("failed")
    }, [])

    if (!context) return null

    /**
     * Các dòng hàng đang mua. Người gọi truyền `lines` (giỏ nhiều món) thì dùng nguyên;
     * lối mua-ngay một khoá chỉ có `title`/`imageUrl` nên dựng MỘT dòng từ đó — bước Tóm
     * tắt không bao giờ được rỗng.
     */
    const lines: Array<PaymentLine> =
        context.lines && context.lines.length > 0
            ? context.lines
            : [
                {
                    id: context.itemIds[0] ?? "single",
                    name: context.title,
                    priceVnd: amountVnd,
                    originalPriceVnd: context.originalAmountVnd ?? null,
                    imageUrl: context.imageUrl ?? null,
                },
            ]

    /** Tạm tính = tổng giá NIÊM YẾT các dòng (chưa trừ khuyến mãi/mã/Xu). */
    const subtotalVnd = lines.reduce(
        (sum, line) => sum + Math.max(line.originalPriceVnd ?? 0, line.priceVnd),
        0,
    )
    /** Phần giảm do giá bán thấp hơn giá niêm yết (khác hẳn mã giảm giá và Xu). */
    const listSavingVnd = Math.max(subtotalVnd - amountVnd, 0)

    /**
     * Nạp lại MỌI báo giá Xu đang nằm trong cache, không chỉ báo giá của số tiền hiện tại.
     *
     * Báo giá mang SỐ DƯ và TRẦN áp được; trả tiền xong là số dư đổi, nên mọi entry
     * `["GET_COIN_QUOTE_SWR", viewer, amount]` khác đều đã cũ. Mở lại modal cho một khoá
     * có cùng số tiền mà đọc trúng entry cũ thì thanh trượt cho kéo quá số dư thật → 422
     * ngay lúc bấm trả. Lọc theo tiền tố key nên không cần biết trước các số tiền.
     */
    const invalidateCoinQuotes = () => {
        void mutate(
            (key) => Array.isArray(key) && key[0] === "GET_COIN_QUOTE_SWR",
            undefined,
            { revalidate: true },
        )
    }

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
        if (payInFlightRef.current) return
        setPayError(null)
        const payMethod = backendPayMethod(method)
        const couponName = payMethod === "VIETQR" && discount > 0 ? coupon.trim() : undefined
        const coinToApply =
            payMethod === "VIETQR" && coinPlan.coinApplied > 0 ? coinPlan.coinApplied : undefined
        // Ý định trả tiền đổi (đổi mã / kéo lại thanh Xu / đổi phương thức) ⇒ khoá mới;
        // bấm lại CÙNG một ý định ⇒ dùng lại khoá cũ để backend gộp về một đơn.
        const intent = `${payMethod}|${couponName ?? ""}|${coinToApply ?? 0}|${context.itemIds.join(",")}`
        if (payIntentRef.current !== intent || !idempotencyKeyRef.current) {
            payIntentRef.current = intent
            idempotencyKeyRef.current = crypto.randomUUID()
        }
        payInFlightRef.current = true
        try {
            const result = await checkoutSwr.trigger({
                itemIds: context.itemIds,
                couponName,
                payMethod,
                // Gửi SỐ XU, không gửi số tiền: backend tự tính lại phần còn phải trả.
                coinToApply,
                idempotencyKey: idempotencyKeyRef.current,
            })
            // Đơn đã thanh toán xong ngay tại đây: rail COIN luôn đồng bộ, và rail VND khi
            // Xu phủ trọn số tiền (amount = 0 ⇒ status PAID, qrCode rỗng) — KHÔNG hiện màn
            // quét QR trong trường hợp đó.
            if (isPaidOrderStatus(result.status)) {
                setPhase("success")
                void mutateWallet()
                void mutate("GET_CART_SWR")
                invalidateCoinQuotes()
                context?.onSuccess?.()
                return
            }
            if (payMethod === "COIN" || method === "WALLET") {
                // Trả trọn bằng ví mà đơn KHÔNG chốt ngay là bất thường (số tiền còn lại
                // đáng lẽ bằng 0). Không dựng QR từ payload rỗng — báo lỗi, giữ trong modal.
                setPayError(t("checkout.failedHint"))
                invalidateCoinQuotes()
                return
            }
            // VietQR → show the QR and start polling
            setOrderId(result.orderId)
            setQrCode(result.qrCode ?? "")
            setPhase("awaiting")
            // Checkout consumed the cart line server-side — drop the stale cache entry so a later
            // "buy again" doesn't check out a deleted item id (which 500s / shows "chưa xử lý").
            void mutate("GET_CART_SWR")
        } catch (error) {
            // Ở LẠI trong modal (không điều hướng đi) và nói rõ CHƯA TRỪ TIỀN: checkout hỏng
            // nghĩa là đơn không được tạo, ví chưa bị chạm.
            const code = error instanceof RestError ? error.errorCode : undefined
            if (code === "COMMERCE_INSUFFICIENT_COIN") {
                setPayError(t("checkout.coin.overLimit"))
                // Trần vừa đổi phía backend → nạp lại báo giá để thanh trượt về đúng trần mới.
                invalidateCoinQuotes()
            } else if (payMethod === "COIN") {
                setPayError(t("checkout.insufficient"))
            } else {
                setPayError(t("checkout.failedHint"))
            }
        } finally {
            payInFlightRef.current = false
        }
    }

    const close = () => setOpen(false)

    // The payable amount shown per the ACTIVE method (VND or Xu) — reused by the Summary
    // step's total line and the Payment step's slim recap.
    const shown = summaryAmount(method, coinPlan.payableVnd, amountCoin)
    const shownAmountLabel =
        shown.unit === "vnd"
            ? t("checkout.amountVnd", { amount: format.number(shown.value) })
            : t("checkout.amountCoin", { amount: format.number(shown.value) })

    return (
        <Modal isOpen={isOpen} onOpenChange={setOpen}>
            <Modal.Backdrop>
                <Modal.Container>
                    {/* `max-h-full` là CÁI CHỐT của lỗi "giỏ dài không bấm được thanh toán":
                        `.modal__container` của HeroUI đã cao đúng bằng visual viewport, nhưng
                        dialog là flex item với `min-height:auto` nên nó cứ phình theo nội dung
                        và tràn ra ngoài màn hình — 5 khoá + mã giảm giá + Xu + bảng chi phí là
                        đủ để đẩy nút trả tiền xuống dưới mép dưới. Chặn trần ở 100% chiều cao
                        content-box của container (đã trừ `p-4`/`sm:p-10`, và bám visual viewport
                        nên bàn phím ảo mở lên vẫn đúng), rồi để phần thân cuộn bên trong.
                        `min-h-0` đi kèm để dialog được phép co xuống dưới chiều cao nội dung —
                        thiếu nó là bản vá im lặng không có tác dụng. */}
                    <Modal.Dialog className={cn("max-h-full min-h-0 w-full max-w-md", className)}>
                        <Modal.CloseTrigger />
                        <Modal.Header className="flex shrink-0 flex-col gap-3">
                            {/* KHÔNG còn tab Tóm tắt/Thanh toán (góp ý #3): hai tab và nút
                                "Tiếp tục thanh toán" là HAI lối đi cho CÙNG một bước, nên
                                người mua bấm nút rồi vẫn thấy một cái tab như thể còn việc
                                chưa làm. Giờ là một luồng thẳng: Tóm tắt → Thanh toán, quay
                                lại bằng link dưới đây (khoá khi đơn đã đi — `isSummaryLocked`). */}
                            <div className="text-2xl font-bold">{t("checkout.title")}</div>
                            {step === "payment" && !isSummaryLocked(phase) ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="self-start"
                                    onPress={() => setStep("summary")}
                                >
                                    <ArrowLeftIcon aria-hidden focusable="false" className="size-4" />
                                    {t("checkout.backToSummary")}
                                </Button>
                            ) : null}
                        </Modal.Header>
                        <Modal.Body className="flex min-h-0 flex-1 flex-col gap-5">
                            {/* Vùng cuộn DUY NHẤT của modal — cùng bài thuốc với thẻ mua khoá
                                (`CourseDetail`) và `OutlineRail`: `ScrollShadow hideScrollBar`
                                + `min-h-0 flex-1 overflow-y-auto`, không tự chế `overflow-y-auto`.
                                Nó ôm trọn nội dung nên `.modal__body` (bản thân đã `overflow-y-auto`
                                theo `scroll="inside"`) không bao giờ tràn → KHÔNG có thanh cuộn
                                lồng nhau. Giỏ ngắn thì mọi thứ vừa khung, `flex-1` chỉ căng bằng
                                đúng nội dung nên không đổi một pixel nào.

                                KHÔNG dùng mẹo `-mx-1 … px-1` như `OutlineRail`/`CourseDetail`:
                                ở đó vùng cuộn nằm trong một khối thường, còn ở đây cha của nó
                                (`.modal__body`) TỰ LÀ một scroll container — lề âm làm con rộng
                                hơn cha 8px, sinh THANH CUỘN NGANG ăn mất 10px chiều cao và đội
                                dialog cao thêm đúng 10px kể cả khi giỏ chỉ có 1 món (đo được).
                                `overflow-x-hidden` giữ lại để tên khoá dài không đẻ cuộn ngang. */}
                            <ScrollShadow
                                hideScrollBar
                                className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto"
                            >
                                {step === "summary" ? (
                                    <div className="flex flex-col gap-5">
                                        <OrderLines t={t} format={format} lines={lines} />

                                        {/* Mã giảm giá ngay tại Tóm tắt — không bắt sang tab khác mới thấy. */}
                                        <CouponField
                                            t={t}
                                            coupon={coupon}
                                            setCoupon={setCoupon}
                                            discount={discount}
                                            couponError={couponError}
                                            couponPending={couponSwr.isMutating}
                                            applyCoupon={applyCoupon}
                                            clearCoupon={clearCoupon}
                                        />

                                        {/* Dùng Xu trong ví để giảm tiền — trần + tỉ lệ đều của backend. */}
                                        {showVietqr && method !== "COIN" ? (
                                            <CoinApplyField
                                                t={t}
                                                format={format}
                                                balance={quote?.balance ?? balance}
                                                ceiling={coinCeiling}
                                                value={coinPlan.coinApplied}
                                                discountVnd={coinPlan.coinDiscountVnd}
                                                isLoading={coinQuoteSwr.isLoading}
                                                isLocked={method === "WALLET"}
                                                onChange={setRequestedCoin}
                                            />
                                        ) : null}

                                        <CostBreakdown
                                            t={t}
                                            format={format}
                                            subtotalVnd={subtotalVnd}
                                            listSavingVnd={listSavingVnd}
                                            couponDiscountVnd={discount}
                                            coinDiscountVnd={coinPlan.coinDiscountVnd}
                                            totalLabel={shownAmountLabel}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-5">
                                        {/* slim recap — số dòng hàng + số tiền còn phải trả */}
                                        <div className="flex items-center gap-3 rounded-2xl border border-separator p-3">
                                            {lines[0]?.imageUrl ? (
                                                <CoverImage
                                                    src={lines[0].imageUrl}
                                                    alt={lines[0].name}
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
                                                canPayByWallet={canPayByWallet}
                                                walletCoinCost={coinPlan.coinApplied}
                                                coinApplied={
                                                    method === "WALLET" ? 0 : coinPlan.coinApplied
                                                }
                                                payableVnd={coinPlan.payableVnd}
                                                amountCoin={amountCoin ?? 0}
                                                balance={quote?.balance ?? balance}
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
                                                amount={coinPlan.payableVnd}
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
                            </ScrollShadow>
                        </Modal.Body>
                        {/* Nút chính của bước Tóm tắt được GHIM ngoài vùng cuộn: đây là bước
                            DUY NHẤT cao theo số món trong giỏ, nên cũng là bước duy nhất từng
                            nuốt mất nút. Đây là phép DỜI thuần tuý — nút vốn nằm thẳng trong
                            modal, không thuộc `ChooseView`/`AwaitingView`/`SuccessView`/
                            `FailedView`, nên bốn view kia không phải sửa một dòng nào; chúng
                            có chiều cao chặn trên (không phình theo giỏ) và giữ nút hành động
                            bên trong vùng cuộn như cũ. `.modal__body + .modal__footer` của
                            HeroUI tự thêm `mt-5`, đúng bằng `gap-5` cũ nên khoảng cách không đổi. */}
                        {step === "summary" ? (
                            <Modal.Footer className="shrink-0">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    className="rounded-full"
                                    onPress={() => setStep("payment")}
                                >
                                    {t("checkout.continueToPayment")}
                                    <ArrowRightIcon aria-hidden focusable="false" className="size-4" />
                                </Button>
                            </Modal.Footer>
                        ) : null}
                    </Modal.Dialog>
                </Modal.Container>
            </Modal.Backdrop>
        </Modal>
    )
}

type Tr = ReturnType<typeof useTranslations>
type Fmt = ReturnType<typeof useFormatter>

/**
 * Danh sách TỪNG khoá đang mua (ảnh · tên · giá, gạch giá niêm yết khi có giảm).
 * Người mua phải đối chiếu được mình đang trả cho cái gì trước khi bấm.
 */
const OrderLines = ({
    t,
    format,
    lines,
}: {
    t: Tr
    format: Fmt
    lines: Array<PaymentLine>
}) => (
    <div className="flex flex-col gap-3">
        <Typography type="body-sm" weight="semibold" color="muted">
            {t("checkout.itemsTitle", { count: lines.length })}
        </Typography>
        <ul className="flex flex-col gap-3">
            {lines.map((line) => (
                <li key={line.id} className="flex items-start gap-3">
                    {line.imageUrl ? (
                        <CoverImage
                            src={line.imageUrl}
                            alt={line.name}
                            className="size-14 shrink-0"
                        />
                    ) : null}
                    <Typography
                        type="body-sm"
                        weight="medium"
                        className="min-w-0 flex-1 line-clamp-2"
                    >
                        {line.name}
                    </Typography>
                    <div className="shrink-0 text-right">
                        {line.originalPriceVnd != null && line.originalPriceVnd > line.priceVnd ? (
                            <PriceTag
                                discounted={line.priceVnd}
                                original={line.originalPriceVnd}
                                size="sm"
                            />
                        ) : (
                            <Typography type="body-sm" weight="semibold">
                                {t("checkout.amountVnd", { amount: format.number(line.priceVnd) })}
                            </Typography>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    </div>
)

/** Ô nhập mã giảm giá (sống ở bước Tóm tắt). */
const CouponField = ({
    t,
    coupon,
    setCoupon,
    discount,
    couponError,
    couponPending,
    applyCoupon,
    clearCoupon,
}: {
    t: Tr
    coupon: string
    setCoupon: (v: string) => void
    discount: number
    couponError: boolean
    couponPending: boolean
    applyCoupon: () => void
    clearCoupon: () => void
}) => (
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
    </div>
)

/**
 * "Dùng Xu để giảm tiền": số dư + thanh trượt chọn số Xu áp vào.
 *
 * Trần thanh trượt (`ceiling`) là TRẦN CỦA BACKEND đã kẹp theo số dư — FE không tự suy ra
 * từ số tiền đơn, nên số kéo được luôn là số backend chấp nhận. Không có Xu nào áp được
 * thì vẫn hiện số dư (để người mua biết ví đang có gì) nhưng không hiện thanh trượt.
 */
const CoinApplyField = ({
    t,
    format,
    balance,
    ceiling,
    value,
    discountVnd,
    isLoading,
    isLocked,
    onChange,
}: {
    t: Tr
    format: Fmt
    balance: number
    /** Trần Xu áp được (của backend). */
    ceiling: number
    /** Số Xu đang áp (đã kẹp). */
    value: number
    /** Số VND giảm được tương ứng. */
    discountVnd: number
    isLoading: boolean
    /** `true` khi đang chọn "trả trọn bằng Ví" — số Xu do phương thức quyết, không kéo tay. */
    isLocked: boolean
    onChange: (coin: number) => void
}) => (
    <div className="flex flex-col gap-3 rounded-2xl border border-separator p-4">
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <CoinsIcon aria-hidden focusable="false" className="size-4 text-accent" />
                <Typography type="body-sm" weight="semibold">
                    {t("checkout.coin.title")}
                </Typography>
            </div>
            <Typography type="body-sm" color="muted">
                {t("checkout.coin.balance", { amount: format.number(balance) })}
            </Typography>
        </div>

        {isLoading ? (
            <Typography type="body-xs" color="muted">
                {t("checkout.coin.loading")}
            </Typography>
        ) : ceiling <= 0 ? (
            <Typography type="body-xs" color="muted">
                {t("checkout.coin.unavailable")}
            </Typography>
        ) : (
            <>
                {/* Ô NHẬP chứ không phải thanh kéo (góp ý #2): trần Xu thường là hàng
                    trăm, một thanh kéo rộng ~300px không cho gõ đúng con số muốn áp —
                    mỗi pixel là vài Xu. Gõ tay thì chính xác tuyệt đối; hai nút tắt
                    "dùng tối đa" / "bỏ dùng Xu" vẫn ở lại cho ca dùng phổ biến nhất.
                    Kẹp trần vẫn do `clampCoinToApply` (backend cấp trần) lo, ô nhập chỉ
                    là cách gõ số. */}
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <TextField variant="secondary" className="w-40">
                        {/* Label, không Typography: react-aria bắt mọi `Text` trong
                            TextField phải có `slot`. */}
                        <Label className="mb-1 block text-xs text-muted">
                            {t("checkout.coin.sliderLabel")}
                        </Label>
                        <Input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={ceiling}
                            step={1}
                            value={String(value)}
                            disabled={isLocked}
                            onChange={(event) => onChange(Number(event.target.value))}
                        />
                    </TextField>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            isDisabled={isLocked || value >= ceiling}
                            onPress={() => onChange(ceiling)}
                        >
                            {t("checkout.coin.max")}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            isDisabled={isLocked || value <= 0}
                            onPress={() => onChange(0)}
                        >
                            {t("checkout.coin.none")}
                        </Button>
                    </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <Typography type="body-sm" weight="medium">
                        {t("checkout.coin.applied", { amount: format.number(value) })}
                    </Typography>
                    {discountVnd > 0 ? (
                        <Chip size="sm" variant="soft" color="success">
                            {t("checkout.discount", { amount: format.number(discountVnd) })}
                        </Chip>
                    ) : null}
                </div>
            </>
        )}
    </div>
)

/** Bảng tiền: tạm tính → các khoản giảm → tổng cuối. */
const CostBreakdown = ({
    t,
    format,
    subtotalVnd,
    listSavingVnd,
    couponDiscountVnd,
    coinDiscountVnd,
    totalLabel,
}: {
    t: Tr
    format: Fmt
    subtotalVnd: number
    listSavingVnd: number
    couponDiscountVnd: number
    coinDiscountVnd: number
    /** Tổng cuối đã định dạng theo đơn vị của phương thức đang chọn (VND hoặc Xu). */
    totalLabel: string
}) => (
    <div className="flex flex-col gap-2 border-t border-separator pt-4">
        <Row
            label={t("checkout.subtotal")}
            value={t("checkout.amountVnd", { amount: format.number(subtotalVnd) })}
        />
        {listSavingVnd > 0 ? (
            <Row
                label={t("checkout.saleDiscount")}
                value={`− ${t("checkout.amountVnd", { amount: format.number(listSavingVnd) })}`}
                tone="success"
            />
        ) : null}
        {couponDiscountVnd > 0 ? (
            <Row
                label={t("checkout.couponDiscount")}
                value={`− ${t("checkout.amountVnd", { amount: format.number(couponDiscountVnd) })}`}
                tone="success"
            />
        ) : null}
        {coinDiscountVnd > 0 ? (
            <Row
                label={t("checkout.coinDiscount")}
                value={`− ${t("checkout.amountVnd", { amount: format.number(coinDiscountVnd) })}`}
                tone="success"
            />
        ) : null}
        <div className="flex items-center justify-between gap-2 pt-1">
            <Typography type="body" weight="semibold">
                {t("checkout.total")}
            </Typography>
            <Typography type="h4" weight="bold" className="text-accent">
                {totalLabel}
            </Typography>
        </div>
    </div>
)

/** Một dòng nhãn — số tiền trong bảng tiền. */
const Row = ({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone?: "success"
}) => (
    <div className="flex items-center justify-between gap-2">
        <Typography type="body-sm" color="muted">
            {label}
        </Typography>
        <Typography
            type="body-sm"
            weight="medium"
            className={cn(tone === "success" ? "text-success" : undefined)}
        >
            {value}
        </Typography>
    </div>
)

/** Chọn phương thức trả tiền + nút thanh toán. */
const ChooseView = ({
    t,
    format,
    method,
    setMethod,
    showVietqr,
    showCoin,
    canPayByWallet,
    walletCoinCost,
    coinApplied,
    payableVnd,
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
    /** Ví đủ trả trọn đơn (theo báo giá backend) → mở lựa chọn "Thanh toán bằng Ví". */
    canPayByWallet: boolean
    /** Số Xu sẽ bị trừ nếu trả trọn bằng Ví. */
    walletCoinCost: number
    /** Số Xu đang áp để GIẢM tiền trên rail chuyển khoản (0 khi đang chọn Ví). */
    coinApplied: number
    /** Số VND còn phải trả sau khi trừ Xu. */
    payableVnd: number
    amountCoin: number
    balance: number
    payError: string | null
    payPending: boolean
    pay: () => void
}) => {
    // Rail COIN (giá Xu riêng của sản phẩm) — thiếu Xu thì chặn ngay ở FE.
    const insufficient = method === "COIN" && balance < amountCoin
    return (
        <div className="flex flex-col gap-4">
            {/* phương thức — chỉ hiện khi có nhiều hơn một lựa chọn */}
            {showVietqr && (showCoin || canPayByWallet) ? (
                <div className="flex flex-col gap-2">
                    <Button
                        variant={method === "VIETQR" ? "secondary" : "ghost"}
                        onPress={() => setMethod("VIETQR")}
                        fullWidth
                    >
                        <BankIcon className="size-4" aria-hidden />
                        {t("checkout.method.vietqr")}
                    </Button>
                    {canPayByWallet ? (
                        <Button
                            variant={method === "WALLET" ? "secondary" : "ghost"}
                            onPress={() => setMethod("WALLET")}
                            fullWidth
                        >
                            <WalletIcon className="size-4" aria-hidden />
                            {t("checkout.method.wallet")}
                        </Button>
                    ) : null}
                    {showCoin ? (
                        <Button
                            variant={method === "COIN" ? "secondary" : "ghost"}
                            onPress={() => setMethod("COIN")}
                            fullWidth
                        >
                            <CoinsIcon className="size-4" aria-hidden />
                            {t("checkout.method.coin")}
                        </Button>
                    ) : null}
                </div>
            ) : null}

            {/* Chuyển khoản: nói rõ Xu đã áp giảm bao nhiêu, còn phải chuyển bao nhiêu */}
            {method === "VIETQR" ? (
                <div className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                    {coinApplied > 0 ? (
                        <Typography type="body-sm" color="muted">
                            {t("checkout.coin.appliedHint", { amount: format.number(coinApplied) })}
                        </Typography>
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                        <Typography type="body-sm" color="muted">
                            {t("checkout.transferAmount")}
                        </Typography>
                        <Typography type="body-sm" weight="bold" className="text-accent">
                            {t("checkout.amountVnd", { amount: format.number(payableVnd) })}
                        </Typography>
                    </div>
                </div>
            ) : null}

            {/* Ví: trả trọn bằng Xu — không sinh QR */}
            {method === "WALLET" ? (
                <div className="flex flex-col gap-2 rounded-2xl border border-separator p-4">
                    <div className="flex items-center justify-between gap-2">
                        <Typography type="body-sm" color="muted">
                            {t("checkout.coin.walletCharge")}
                        </Typography>
                        <Typography type="body-sm" weight="bold" className="text-accent">
                            {t("checkout.amountCoin", { amount: format.number(walletCoinCost) })}
                        </Typography>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <Typography type="body-sm" color="muted">
                            {t("checkout.coin.balance", { amount: format.number(balance) })}
                        </Typography>
                        <Typography type="body-xs" color="muted">
                            {t("checkout.coin.walletNoQr")}
                        </Typography>
                    </div>
                </div>
            ) : null}

            {/* Rail Xu riêng của sản phẩm: số dư ví */}
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
                <div className="flex flex-col gap-1">
                    <Typography type="body-xs" className="text-danger">
                        {payError}
                    </Typography>
                    <Typography type="body-xs" color="muted">
                        {t("checkout.notCharged")}
                    </Typography>
                </div>
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
            {qrCode ? (
                <QRCode size={220} data={qrCode} />
            ) : (
                // Đơn VIETQR nhưng BE trả payload rỗng → báo lỗi, KHÔNG vẽ QR mồi (mã rác không quét được).
                <div
                    role="alert"
                    className="flex size-[220px] items-center justify-center rounded-lg border border-dashed border-default bg-default px-5 text-center"
                >
                    <Typography type="body-sm" color="muted">
                        {t("checkout.qrError")}
                    </Typography>
                </div>
            )}
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
