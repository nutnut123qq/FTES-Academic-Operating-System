"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { GraphQLResponse } from "@/modules/api/graphql/types"
import type { PurchaseCheckoutData } from "@/modules/api/graphql/mutations/types/purchase-checkout"
import { useGetOrderSwr } from "@/hooks/swr/api/rest/queries/useGetOrderSwr"
import { planOrderPhase, type PlanOrderPhase } from "./planOrderPhase"

/** The live order a plan purchase is waiting on. */
export interface PlanPurchaseTicket {
    /** Commerce order id — polled for settlement and quoted as the transfer reference. */
    orderId: string
    /** VietQR EMVCo payload to render. */
    qrCode: string
    /** Amount due in VND, frozen at order creation. */
    amount: number
}

/** Options for {@link usePlanPurchase}. */
export interface UsePlanPurchaseOptions {
    /**
     * Runs the purchase mutation and returns its envelope. Both plan mutations answer
     * the same `PurchaseCheckoutData`, which is why one hook drives both screens.
     */
    start: () => Promise<GraphQLResponse<PurchaseCheckoutData> | null | undefined>
    /** Fired once per settled order — revalidate whatever proves the plan is now held. */
    onPaid?: () => void
    /** Localized line shown when the order could not be created at all. */
    failureMessage: string
}

/**
 * The purchase half of both plan screens: create ONE order, then follow it until the
 * bank settles it. Same machinery as the course checkout — the mutation hands back a
 * VietQR payload plus an order id, and {@link useGetOrderSwr} polls that order until it
 * reaches a terminal status (the poll stops itself).
 *
 * Money-path rules baked in here:
 *
 * - **An order is only claimed to exist when it really does.** A `success: false`
 *   envelope, or one missing the QR / order id, is reported as a failure and leaves
 *   `ticket` null — the dialog stays put and says nothing was charged, instead of
 *   showing a QR nobody can pay or navigating away from the truth.
 * - **Two presses never make two orders.** `confirm` is inert while a request is in
 *   flight or while an order is already live, and the backend additionally returns the
 *   same open order for a repeated purchase of the same plan.
 * - **`onPaid` fires at most once per order** (keyed on the order id), so a settled
 *   order that keeps re-rendering cannot re-trigger side effects.
 * - **The countdown is the backend's, not a guess.** There is no client-side expiry
 *   clock: the order flips to `EXPIRED` when the server's own expiry job says so, which
 *   is the only deadline that actually voids the QR.
 */
export const usePlanPurchase = ({ start, onPaid, failureMessage }: UsePlanPurchaseOptions) => {
    const [ticket, setTicket] = useState<PlanPurchaseTicket | null>(null)
    const [seedStatus, setSeedStatus] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)

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
            const envelope = await startRef.current()
            const data = envelope?.data
            if (!envelope?.success || !data?.qrCode || !data?.referenceId) {
                setErrorMessage(envelope?.message || failureMessage)
                return
            }
            setSeedStatus(data.orderStatus ?? null)
            setTicket({
                orderId: data.referenceId,
                qrCode: data.qrCode,
                amount: data.amount ?? 0,
            })
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

    return { ticket, phase, errorMessage, isStarting, confirm, reset }
}
