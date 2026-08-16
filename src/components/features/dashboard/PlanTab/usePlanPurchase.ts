"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cancelOrder } from "@/modules/api/rest/commerce"
import { useGetOrderSwr } from "@/hooks/swr/api/rest/queries/useGetOrderSwr"
import { planOrderPhase, type PlanOrderPhase } from "./planOrderPhase"

/** The live order a plan purchase is waiting on. */
export interface PlanPurchaseTicket {
    /** Commerce order id — polled for settlement and quoted as the transfer reference. */
    orderId: string
    /**
     * VietQR EMVCo payload to render. RỖNG khi Xu đã phủ trọn đơn: backend cố tình không
     * dựng QR 0đ, nên không có gì để quét (và cũng không cần).
     */
    qrCode: string
    /**
     * Số tiền CÒN PHẢI TRẢ bằng VND, chốt lúc tạo đơn — đã trừ phần Xu áp vào. `0` ⇒ đơn
     * đã thanh toán xong bằng Xu.
     */
    amount: number
    /** Số Xu backend THỰC SỰ trừ khỏi ví cho đơn này (0 = không dùng Xu). */
    coinApplied: number
    /** Số VND mà `coinApplied` giảm được. */
    coinDiscountVnd: number
}

/**
 * Kết quả của một lần bấm xác nhận. Thất bại mang sẵn CÂU đã dịch, vì chỉ chỗ gọi mới biết
 * lỗi đó nên nói thế nào (mỗi màn có bảng chữ riêng).
 */
export type PlanStartOutcome =
    | { ok: true; ticket: PlanPurchaseTicket; status?: string | null }
    | { ok: false; message?: string | null }

/** Options for {@link usePlanPurchase}. */
export interface UsePlanPurchaseOptions {
    /**
     * Tạo đơn và trả về kết quả đã chuẩn hoá. Hai màn gói đi hai đường khác nhau (gói hội
     * viên qua mutation GraphQL, gói AI qua giỏ → checkout REST vì chỉ đường đó nhận Xu),
     * nên hook nhận KẾT QUẢ chứ không nhận envelope của một đường cụ thể.
     */
    start: () => Promise<PlanStartOutcome | null | undefined>
    /** Fired once per settled order — revalidate whatever proves the plan is now held. */
    onPaid?: () => void
    /** Localized line shown when the order could not be created at all. */
    failureMessage: string
    /** Localized line shown when huỷ đơn thất bại (Xu chưa quay về ví). */
    cancelFailureMessage?: string
}

/**
 * The purchase half of both plan screens: create ONE order, then follow it until the
 * bank settles it. Same machinery as the course checkout — the checkout hands back a
 * VietQR payload plus an order id, and {@link useGetOrderSwr} polls that order until it
 * reaches a terminal status (the poll stops itself).
 *
 * Money-path rules baked in here:
 *
 * - **An order is only claimed to exist when it really does.** A failed outcome leaves
 *   `ticket` null — the dialog stays put and says nothing was charged, instead of showing
 *   a QR nobody can pay or navigating away from the truth.
 * - **Two presses never make two orders.** `confirm` is inert while a request is in
 *   flight or while an order is already live, and the backend additionally returns the
 *   same order for a repeated checkout with the same idempotency key.
 * - **`onPaid` fires at most once per order** (keyed on the order id), so a settled
 *   order that keeps re-rendering cannot re-trigger side effects.
 * - **The countdown is the backend's, not a guess.** There is no client-side expiry
 *   clock: the order flips to `EXPIRED` when the server's own expiry job says so, which
 *   is the only deadline that actually voids the QR.
 * - **Huỷ đơn là đường TRẢ XU VỀ VÍ.** Xu bị trừ NGAY lúc checkout, nên khi người mua đổi
 *   ý thì phải huỷ đơn thật ({@link cancelOrder}) chứ không được chỉ quên nó đi ở FE —
 *   quên đi là để Xu nằm ngoài ví tới lúc đơn hết hạn. Huỷ hỏng thì KHÔNG xoá vé: người
 *   mua vẫn phải thấy đơn đang giữ Xu của mình.
 */
export const usePlanPurchase = ({
    start,
    onPaid,
    failureMessage,
    cancelFailureMessage,
}: UsePlanPurchaseOptions) => {
    const [ticket, setTicket] = useState<PlanPurchaseTicket | null>(null)
    const [seedStatus, setSeedStatus] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    // Both callbacks are re-created by the caller on every render; holding them in refs
    // keeps `confirm` stable so it can be handed to a button without re-subscribing.
    const startRef = useRef(start)
    startRef.current = start
    const onPaidRef = useRef(onPaid)
    onPaidRef.current = onPaid

    const orderPoll = useGetOrderSwr(ticket?.orderId ?? "", { poll: ticket !== null })

    /** `null` until an order exists; afterwards the settled truth of that order. */
    const phase: PlanOrderPhase | null = ticket
        ? planOrderPhase(orderPoll.data?.status ?? seedStatus)
        : null

    const paidOrderRef = useRef<string | null>(null)
    useEffect(() => {
        if (phase !== "paid" || !ticket) return
        if (paidOrderRef.current === ticket.orderId) return
        paidOrderRef.current = ticket.orderId
        onPaidRef.current?.()
    }, [phase, ticket])

    /**
     * Create the order. No-op while one is in flight or already live. The guard is a
     * REF, not the `isStarting` state: two clicks inside one render tick would both read
     * the same stale `false` from state and fire twice, and on this path that is two
     * orders for one purchase.
     */
    const inFlightRef = useRef(false)
    const confirm = useCallback(async () => {
        if (inFlightRef.current || ticket) return
        inFlightRef.current = true
        setErrorMessage(null)
        setIsStarting(true)
        try {
            const outcome = await startRef.current()
            if (!outcome?.ok) {
                setErrorMessage(outcome?.message || failureMessage)
                return
            }
            setSeedStatus(outcome.status ?? null)
            setTicket(outcome.ticket)
        } catch {
            setErrorMessage(failureMessage)
        } finally {
            inFlightRef.current = false
            setIsStarting(false)
        }
    }, [failureMessage, ticket])

    /** Drop the order being watched and go back to the confirm step. */
    const reset = useCallback(() => {
        setTicket(null)
        setSeedStatus(null)
        setErrorMessage(null)
        paidOrderRef.current = null
    }, [])

    /**
     * Huỷ đơn đang chờ rồi quay lại bước xác nhận — đường DUY NHẤT để lấy lại số Xu đã áp
     * (backend hoàn Xu trong `releaseResources`, idempotent). Trả về `true` khi đã huỷ
     * xong; `false` thì vé được GIỮ NGUYÊN kèm câu báo lỗi, vì lúc đó Xu vẫn đang ở ngoài ví.
     */
    const cancel = useCallback(async (): Promise<boolean> => {
        if (!ticket) {
            reset()
            return true
        }
        if (isCancelling) return false
        setIsCancelling(true)
        try {
            await cancelOrder(ticket.orderId)
            reset()
            return true
        } catch {
            setErrorMessage(cancelFailureMessage || failureMessage)
            return false
        } finally {
            setIsCancelling(false)
        }
    }, [cancelFailureMessage, failureMessage, isCancelling, reset, ticket])

    return { ticket, phase, errorMessage, isStarting, isCancelling, confirm, reset, cancel }
}
